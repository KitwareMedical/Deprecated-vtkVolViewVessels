import sys
import numpy as np

# import itk modules.
import itk
from itkTypes import itkCType
import ctypes

# import client methods
from server import register, Protocol

# import tube utils
from tubeutils import GetTubePoints

# maps itk ctype to other types
itkCTypeToOthers = {
        itk.B: (ctypes.c_bool, 'UInt8Array', 1, 'i'),
        itk.D: (ctypes.c_double, 'Float64Array', 8, 'f'),
        itk.F: (ctypes.c_float, 'Float32Array', 4, 'f'),
        itk.LD: (ctypes.c_longdouble, 'Float64Array', 8, 'f'),
        itk.SC: (ctypes.c_char, 'Int8Array', 1, 'i'),
        itk.SI: (ctypes.c_int, 'Int32Array', 4, 'i'),
        itk.SL: (ctypes.c_long, 'Int32Array', 4, 'i'),
        itk.SLL: (ctypes.c_longlong, 'Int32Array', 4, 'i'),
        itk.SS: (ctypes.c_short, 'Int16Array', 2, 'i'),
        itk.UC: (ctypes.c_ubyte, 'UInt8Array', 1, 'i'),
        itk.UI: (ctypes.c_uint, 'UInt32Array', 4, 'i'),
        itk.UL: (ctypes.c_ulong, 'UInt32Array', 4, 'i'),
        itk.ULL: (ctypes.c_ulonglong, 'UInt32Array', 4, 'i'),
        itk.US: (ctypes.c_ushort, 'UInt16Array', 2, 'i'),
}

# While this may seem weird, the itk module has a property access
# side-effect of loading in the required module for that property
# via lazy-loading.
# These lines force itk module load on startup so that calls to open
# ITK images and segment tubes will be faster.
itk.CompositeTransform
itk.TranslationTransform
itk.ScaleTransform
itk.Image
itk.SegmentTubes
itk.ImageIOFactory.CreateImageIO
itk.ImageFileReader

class ITKTubeProtocol(Protocol):
    def __init__(self, *args, **kwargs):
        super(ITKTubeProtocol, self).__init__(*args, **kwargs)

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
        self.curTubeId = 0

        scaleVector = self.itkImage.GetSpacing()
        offsetVector = self.itkImage.GetOrigin()

        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetScale(scaleVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetOffset(offsetVector)
        self.segmentTubes.GetTubeGroup().GetObjectToParentTransform() \
                .SetMatrix(self.itkImage.GetDirection())
        self.segmentTubes.GetTubeGroup().ComputeObjectToWorldTransform()

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

    @register('itk.volume.open')
    def openVolume(self, filename):
        filename = str(filename)
        if not filename:
            raise Exception('No filename provided')

        try:
            self.loadDataFile(filename)
        except Exception as e:
            sys.stderr.write('%s\n' % str(e))
            raise Exception('Failed to load file.')

        # Get ITK image data
        imgCType, imgJsArrType, pixelSize, pixelDType = itkCTypeToOthers[self.itkPixelType]
        pointer = long(self.itkImage.GetBufferPointer())
        imageBuffer = ctypes.cast(pointer, ctypes.POINTER(imgCType))
        size = self.itkImage.GetLargestPossibleRegion().GetSize()
        length = size[0]*size[1]*size[2]

        imgArray = np.ctypeslib.as_array(
                (imgCType * length).from_address(ctypes.addressof(imageBuffer.contents)))

        resp = {
            "extent": (0, size[0]-1, 0, size[1]-1, 0, size[2]-1),
            "origin": list(self.itkImage.GetOrigin()),
            "spacing": list(self.itkImage.GetSpacing()),
            "typedArray": imgJsArrType,
        }
        return self.makeResponse(resp, imgArray.tobytes())
