r"""
    This module is a ITK Web server application.
    The following command line illustrates how to use it::

        $ python .../server/itk-tube.py --data /.../path-to-your-data-file

        --data
             Path to file to load.

    Any WSLink executable script comes with a set of standard arguments that can be overriden if need be::

        --port 8080
             Port number on which the HTTP server will listen.

        --content /path-to-web-content/
             Directory that you want to serve as static web content.
             By default, this variable is empty which means that we rely on another
             server to deliver the static content and the current process only
             focuses on the WebSocket connectivity of clients.
"""

# import to process args
import os
import argparse

import numpy as np

# import itk modules.
import itk
from itkTypes import itkCType
import ctypes

# import Twisted reactor for later callback
from twisted.internet import reactor

# import Web connectivity
from wslink import register
from wslink import server
from wslink.websocket import LinkProtocol

# import tube utils
from tubeutils import GetTubePoints

# map from itkCType to ctype
itkCTypeToCtype = {
        itk.B: ctypes.c_bool,
        itk.D: ctypes.c_double,
        itk.F: ctypes.c_float,
        itk.LD: ctypes.c_longdouble,
        itk.SC: ctypes.c_char,
        itk.SI: ctypes.c_int,
        itk.SL: ctypes.c_long,
        itk.SLL: ctypes.c_longlong,
        itk.SS: ctypes.c_short,
        itk.UC: ctypes.c_ubyte,
        itk.UI: ctypes.c_uint,
        itk.UL: ctypes.c_ulong,
        itk.ULL: ctypes.c_ulonglong,
        itk.US: ctypes.c_ushort
}

# map from itk ctype to js array type
itkCTypeToJsArray = {
        itk.B: 'UInt8Array',
        itk.D: 'Float64Array',
        itk.F: 'Float32Array',
        itk.LD: 'Float64Array',
        itk.SC: 'Int8Array',
        itk.SI: 'Int32Array',
        itk.SL: 'Int32Array',
        itk.SLL: 'Int32Array',
        itk.SS: 'Int16Array',
        itk.UC: 'UInt8Array',
        itk.UI: 'UInt32Array',
        itk.UL: 'UInt32Array',
        itk.ULL: 'UInt32Array',
        itk.US: 'UInt16Array',
}

# map from itk ctype to numpy dtype
itkCTypeToDType = {
        itk.B: 1,
        itk.D: 8,
        itk.F: 4,
        itk.LD: 8,
        itk.SC: 1,
        itk.SI: 4,
        itk.SL: 4,
        itk.SLL: 4,
        itk.SS: 2,
        itk.UC: 1,
        itk.UI: 4,
        itk.UL: 4,
        itk.ULL: 4,
        itk.US: 2,
}

# =============================================================================
# Create Web Server to handle requests
# =============================================================================

class ItkTubeProtocol(LinkProtocol):

    timelapse = 0.1 # Time in seconds
    processingLoad = 0

    def __init__(self):
        self.tubeProcessingQueue = list()
        self.idToSpatialObject = dict()
        # NOTE maybe not the most memory-efficient cache since we store points
        # in array form here?
        self.tubeCache = []

    def loadDataFile(self, filename):
        # Load file in ITK
        self.loadItkImage(filename)

        # setup image to world transform, since segmenttubes
        # will use the world coords.
        self.imageToWorldTransform = itk.CompositeTransform[itk.D, 3].New()
        translate = itk.TranslationTransform[itk.D, 3].New()
        translate.Translate(self.itkImage.GetOrigin())
        scale = itk.ScaleTransform[itk.D, 3].New()
        scale.Scale(self.itkImage.GetSpacing())
        self.imageToWorldTransform.AppendTransform(translate)
        self.imageToWorldTransform.AppendTransform(scale)

        # setup segmenter
        imgType = itk.Image[self.itkPixelType, self.dimensions]
        self.segmentTubes = itk.SegmentTubes[imgType].New()
        self.segmentTubes.SetInputImage(self.itkImage)
        self.segmentTubes.SetDebug(True)
        self.curTubeIndex = 0

        scaleVector = self.itkImage.GetSpacing()
        offsetVector = self.itkImage.GetOrigin()

        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetScale(scaleVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetOffset(offsetVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetMatrix(self.itkImage.GetDirection())
        self.segmentTubes.GetTubeGroup().ComputeObjectToWorldTransform()

    def scheduleQueueProcessing(self):
        if self.processingLoad == 0:
            self.processingLoad += 1
            reactor.callLater(ItkTubeProtocol.timelapse, self.processQueue)

    def processQueue(self):
        self.processingLoad -= 1
        if len(self.tubeProcessingQueue) == 0:
            return

        # Find anything in the queue that need processing
        itemToProcess = self.tubeProcessingQueue.pop(0)
        itemToProcess['status'] = 'computing'
        self.publish('itk.tube.mesh', itemToProcess)

        # extract tube
        seed = itk.Point[itk.D, self.dimensions](itemToProcess['position'])
        index = self.itkImage.TransformPhysicalPointToContinuousIndex(seed)

        scaleNorm = self.itkImage.GetSpacing()[0]
        if itemToProcess['scale']/scaleNorm < 0.3:
            raise Exception('scale/scaleNorm < 0.3')
        self.segmentTubes.SetRadius(itemToProcess['scale']/scaleNorm)

        tube = self.segmentTubes.ExtractTube(index, itemToProcess['id'], True)
        if tube:
            self.segmentTubes.AddTube(tube)
            self.idToSpatialObject[itemToProcess['id']] = tube
            tube.ComputeObjectToWorldTransform()

            points = GetTubePoints(tube)

            # transform tube points properly
            tube.ComputeObjectToWorldTransform()
            transform = tube.GetIndexToWorldTransform()
            scaling = [transform.GetMatrix()(i,i) for i in range(3)]
            scale = sum(scaling) / len(scaling)

            for i in range(len(points)):
                pt, radius = points[i]
                pt = transform.TransformPoint(pt)
                points[i] = (pt, radius*scale)

            itemToProcess['mesh'] = [{ 'x': pos[0], 'y': pos[1], 'z': pos[2], 'radius': r } for pos, r in points]
        else:
            itemToProcess['mesh'] = None

        itemToProcess['status'] = 'done'
        self.tubeCache.append(itemToProcess)

        # Publish any update
        self.publish('itk.tube.mesh', itemToProcess)

        # Reschedule ourself
        self.scheduleQueueProcessing()

    def loadItkImage(self, filename):
        base = itk.ImageIOFactory.CreateImageIO(filename, itk.ImageIOFactory.ReadMode)
        base.SetFileName(filename)
        base.ReadImageInformation()

        componentType = base.GetComponentType()
        itkctype = itkCType.GetCType(base.GetComponentTypeAsString(componentType))
        imageType = itk.Image[itkctype, base.GetNumberOfDimensions()]

        reader = itk.ImageFileReader[imageType].New()
        reader.SetFileName(filename)
        reader.Update()

        self.itkImage = reader.GetOutput()
        self.itkPixelType = itkctype
        self.dimensions = base.GetNumberOfDimensions()

    @register('itk.volume.get')
    def getVolumeData(self):
        # Get ITK image data
        pointer = long(self.itkImage.GetBufferPointer())
        imageBuffer = ctypes.cast(pointer, ctypes.POINTER(itkCTypeToCtype[self.itkPixelType]))
        size = self.itkImage.GetLargestPossibleRegion().GetSize()

        buf = imageBuffer[:size[0]*size[1]*size[2]]
        pixelSize = itkCTypeToDType[self.itkPixelType]
        itkBinaryImageContent = np.array(buf, dtype=np.dtype('<i' + str(pixelSize))).tobytes()

        # Send data to client
        return {
            "extent": (0, size[0]-1, 0, size[1]-1, 0, size[2]-1),
            "origin": list(self.itkImage.GetOrigin()),
            "spacing": list(self.itkImage.GetSpacing()),
            "typedArray": itkCTypeToJsArray[self.itkPixelType],
            "scalars": self.addAttachment(itkBinaryImageContent)
        }

    @register('itk.tube.get')
    def getTubes(self):
        return self.tubeCache

    @register('itk.tube.generate')
    def generateTube(self, i, j, k, scale=2.0):
        coords = list(self.imageToWorldTransform.TransformPoint((i, j, k)))
        itemToProcess = {
            'id': self.curTubeIndex,
            'position': coords,
            'scale': scale,
            'status': 'queued',
            'color': [1, 0, 0], # default to red
        }
        self.curTubeIndex += 1
        self.tubeProcessingQueue.append(itemToProcess)
        self.scheduleQueueProcessing()
        return itemToProcess

    @register('itk.tube.delete')
    def deleteTube(self, tubeId):
        tube = self.idToSpatialObject[tubeId]
        self.segmentTubes.DeleteTube(tube)
        del self.idToSpatialObject[tubeId]
        for index, item in enumerate(self.tubeCache):
            if item['id'] == tubeId:
                del self.tubeCache[index]
                break

    @register('itk.tube.setcolor')
    def setTubeColor(self, tubeId, color):
        for item in self.tubeCache:
            if item['id'] == tubeId:
                item['color'] = color
                break
