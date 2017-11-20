import threading
import Queue
import time

import itk

from tubeutils import Enum
from deferred import Deferred

# While this may seem weird, the itk module has a property access
# side-effect of loading in the required module for that property
# via lazy-loading.
# These lines force itk module load on startup so that calls to open
# ITK images and segment tubes will be faster.
itk.CompositeTransform
itk.TranslationTransform
itk.ScaleTransform
itk.Image

Actions = Enum(
    'STOP',
    'SETIMAGE',
)

class TubeWorker(threading.Thread):
    def __init__(self):
        super(TubeWorker, self).__init__()
        self.queue = Queue.Queue()

        self.segmenter = None

    def stop(self):
        self.queue.put((Actions.STOP, None, None))

    def setImage(self, image, pixelType, dimensions):
        deferred = Deferred()
        #self.queue.put((Actions.SETIMAGE, image))
        #return deferred
        # TODO handle case when segmentation is occurring when setImage() is called
        self._setImage(deferred, image, pixelType, dimensions)

    def _setImage(self, deferred, image, pixelType, dimensions):
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

            if action is Actions.STOP:
                return
            elif action is Actions.SETIMAGE:
                self._setImage(deferred, *args)
