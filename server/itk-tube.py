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
# FIXME

# import Twisted reactor for later callback
from twisted.internet import reactor

# import Web connectivity
from wslink import register
from wslink import server
from wslink.websocket import LinkProtocol

# =============================================================================
# Create Web Server to handle requests
# =============================================================================

class _ItkTubeServer(LinkProtocol):

    dataFile = ''
    authKey = 'wslink-secret'
    tubeProcessingQueue = []
    timelapse = 0.1 # Time in seconds
    processingLoad = 0

    @staticmethod
    def add_arguments(parser):
        parser.add_argument("--data", default=None, help="path to data file to load", dest="dataFile")

    @staticmethod
    def configure(args):
        _ItkTubeServer.authKey  = args.authKey
        _ItkTubeServer.dataFile = args.dataFile

    def initialize(self):
        # Load file in ITK
        # FIXME

        # Update authentication key to use
        self.updateSecret(_ItkTubeServer.authKey)

    def scheduleQueueProcessing(self):
        if _ItkTubeServer.processingLoad == 0:
            _ItkTubeServer.processingLoad += 1
            reactor.callLater(_ItkTubeServer.timelapse, self.processQueue)

    def processQueue(self):
        _ItkTubeServer.processingLoad -= 1
        # Find anything in the queue that need processing
        # FIXME
        # FIXME if nothing in 'queued' then return
        itemToProcess = { 'id': 0, 'position': (5, 5, 5), 'status': 'queued' }
        itemToProcess['status'] = 'computing'
        self.publish('itk.tube.mesh', itemToProcess)

        # Compute mesh
        # FIXME
        itemToProcess['mesh'] = [{ 'position': [1, 2, 3], 'radius': 4.5 }, { 'position': [4, 5, 10], 'radius': 4.5 }]

        # Publish any update
        self.publish('itk.tube.mesh', itemToProcess)

        # Reschedule ourself
        self.scheduleQueueProcessing()

    @register('itk.volume.get')
    def getVolumeData(self):
        # Get ITK image data
        # FIXME
        itkBinaryImageContent = 'fixme'

        # Send data to client
        return {
            "extent": [0, 10, 0, 10, 0, 10],
            "origin": [0, 0, 0],
            "spacing": [0.1, 0.15, 0.3],
            "typedArray": 'Float32Array'
            "scalars": self.addAttachment(itkBinaryImageContent);
        }

    @register('itk.tube.generate')
    def generateTube(self, i, j, k):
        id = len(tubeProcessingQueue)
        tubeProcessingQueue.append({ 'id': id, 'position': (i, j, k), 'status': 'queued' });
        scheduleQueueProcessing()
        return id


# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="ITK Tube - Web Server")

    # Add arguments
    server.add_arguments(parser)
    _ItkTubeServer.add_arguments(parser)
    args = parser.parse_args()
    _ItkTubeServer.configure(args)

    # Start server
    server.start_webserver(options=args, protocol=_ItkTubeServer)
