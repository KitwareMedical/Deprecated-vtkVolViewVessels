import threading
import Queue
import time

import itk

from tubeutils import Enum, GetTubePoints
from deferred import Deferred

# While this may seem weird, the itk module has a property access
# side-effect of loading in the required module for that property
# via lazy-loading.
# These lines force itk module load on startup so that calls to open
# ITK images and segment tubes will be faster.
itk.CompositeTransform
itk.TranslationTransform
itk.ScaleTransform
itk.SegmentTubes
itk.Image
itk.Point

Actions = Enum(
    'STOP',
    'SETIMAGE',
    'SEGMENT',
)

class TubeWorker(threading.Thread):
    def __init__(self):
        super(TubeWorker, self).__init__()
        self.queue = Queue.Queue()

        self.segmenter = None
        self.imageData = None
        self.tubeCache = dict()

    def stop(self):
        self.queue.put((Actions.STOP, None, None))

    def setImage(self, image, pixelType, dimensions):
        deferred = Deferred()
        #self.queue.put((Actions.SETIMAGE, image))
        #return deferred
        # TODO handle case when segmentation is occurring when setImage() is called
        self._setImage(deferred, image, pixelType, dimensions)

    def segmentTube(self, tubeId, coords, scale):
        deferred = Deferred()
        self.queue.put((Actions.SEGMENT, deferred, tubeId, coords, scale))
        return deferred

    def deleteTube(self, tubeId):
        self.segmenter.GetTubeGroup().RemoveSpatialObject(self.tubeCache[tubeId])

    def reparentTube(self, parentId, childId):
        child, parent = self.tubeCache[childId], self.tubeCache[parentId]
        child.SetParent(parent)

    def _setImage(self, deferred, image, pixelType, dimensions):
        self.imageData = (image, pixelType, dimensions)

        # setup segmenter
        imgType = itk.Image[pixelType, dimensions].New()
        self.segmenter = itk.SegmentTubes[imgType].New()
        self.segmenter.SetInputImage(image)
        self.segmenter.SetDebug(True)

        # setup image to world transform, since segmenttubes
        # will use the world coords.
        self.imageToWorldTransform = itk.CompositeTransform[itk.D, dimensions].New()

        translate = itk.TranslationTransform[itk.D, dimensions].New()
        translate.Translate(image.GetOrigin())
        self.imageToWorldTransform.AppendTransform(translate)

        scale = itk.ScaleTransform[itk.D, dimensions].New()
        scale.Scale(image.GetSpacing())
        self.imageToWorldTransform.AppendTransform(scale)

        scaleVector = image.GetSpacing()
        offsetVector = image.GetOrigin()

        self.segmenter.GetTubeGroup().GetObjectToParentTransform() \
                .SetScale(scaleVector)
        self.segmenter.GetTubeGroup().GetObjectToParentTransform() \
                .SetOffset(offsetVector)
        self.segmenter.GetTubeGroup().GetObjectToParentTransform() \
                .SetMatrix(image.GetDirection())
        self.segmenter.GetTubeGroup().ComputeObjectToWorldTransform()

        # clear tube cache
        self.tubeCache.clear()

    def _segmentTube(self, deferred, tubeId, coords, scale):
        image, pixelType, dimensions = self.imageData

        # extract tube
        seed = itk.Point[itk.D, dimensions](coords)
        index = image.TransformPhysicalPointToContinuousIndex(seed)

        scaleNorm = image.GetSpacing()[0]
        if scale/scaleNorm < 0.3:
            raise Exception('scale/scaleNorm < 0.3')
        self.segmenter.SetRadius(scale / scaleNorm)

        tube = self.segmenter.ExtractTube(index, tubeId, True)
        if tube:
            self.tubeCache[tubeId] = tube
            self.segmenter.AddTube(tube)
            tube.ComputeObjectToWorldTransform()

            points = GetTubePoints(tube)

            # transform tube points
            tube.ComputeObjectToWorldTransform()
            transform = tube.GetIndexToWorldTransform()
            scaling = [transform.GetMatrix()(i,i) for i in range(3)]
            scale = sum(scaling) / len(scaling)

            for i in range(len(points)):
                pt, radius = points[i]
                pt = list(transform.TransformPoint(pt))
                points[i] = (pt, radius*scale)

            deferred.resolve(points)
        else:
            deferred.resolve(None)

    def run(self):
        while True:
            try:
                time.sleep(0.1)
                msg = self.queue.get(False, 0.5)
                action = msg[0]
                deferred = msg[1]
                args = msg[2:]
            except Queue.Empty:
                continue

            try:
                if action is Actions.STOP:
                    return
                elif action is Actions.SETIMAGE:
                    self._setImage(deferred, *args)
                elif action is Actions.SEGMENT:
                    self._segmentTube(deferred, *args)
            except Exception as e:
                print '[TubeWorker]: %s' % str(e)
