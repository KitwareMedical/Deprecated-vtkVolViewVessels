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
from wslink.websocket import ServerProtocol

from itk_tube import ItkTubeProtocol

# =============================================================================
# Create Web Server to handle requests
# =============================================================================

class _ItkTubeServer(ServerProtocol):

    dataFile = ''
    authKey = 'wslink-secret'

    @staticmethod
    def add_arguments(parser):
        parser.add_argument("--data", default=None, help="path to data file to load", dest="dataFile")

    @staticmethod
    def configure(args):
        _ItkTubeServer.authKey  = args.authKey
        _ItkTubeServer.dataFile = args.dataFile

    def initialize(self):
        # register custom protocol
        protocol = ItkTubeProtocol()
        protocol.loadDataFile(self.dataFile)
        self.registerLinkProtocol(protocol)

        # Update authentication key to use
        self.updateSecret(_ItkTubeServer.authKey)

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
