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

# =============================================================================
# Create Web Server to handle requests
# =============================================================================

class ItkTubeProtocol(LinkProtocol):

    tubeProcessingQueue = []
    timelapse = 0.1 # Time in seconds
    processingLoad = 0

    def loadDataFile(self, filename):
        # Load file in ITK
        self.loadItkImage(filename)

        # setup segmenter
        imgType = itk.Image[self.itkPixelType, self.dimensions]
        self.segmentTubes = itk.SegmentTubes[imgType].New()
        self.segmentTubes.SetInputImage(self.itkImage)
        self.segmentTubes.SetDebug(True)
        self.curTubeIndex = 0

    def scheduleQueueProcessing(self):
        if self.processingLoad == 0:
            self.processingLoad += 1
            reactor.callLater(ItkTubeProtocol.timelapse, self.processQueue)

    def processQueue(self):
        self.processingLoad -= 1
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

        tube = self.segmentTubes.ExtractTube(index, self.curTubeIndex, True)
        if tube:
            self.curTubeIndex += 1

            itemToProcess['mesh'] = [{ 'position': [1, 2, 3], 'radius': 4.5 }, { 'position': [4, 5, 10], 'radius': 4.5 }]
        else:
            itemToProcess['mesh'] = None

        itemToProcess['status'] = 'done'
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
        itkBinaryImageContent = imageBuffer[size[0]*size[1]*size[2]-1]

        # Send data to client
        return {
            "extent": list(size),
            "origin": list(self.itkImage.GetOrigin()),
            "spacing": list(self.itkImage.GetSpacing()),
            "typedArray": itkCTypeToJsArray[self.itkPixelType],
            "scalars": itkBinaryImageContent
        }

    @register('itk.tube.generate')
    def generateTube(self, i, j, k, scale=2.0):
        id = len(self.tubeProcessingQueue)
        self.tubeProcessingQueue.append({ 'id': id, 'position': (i, j, k), 'scale': scale, 'status': 'queued' });
        self.scheduleQueueProcessing()
        return id
