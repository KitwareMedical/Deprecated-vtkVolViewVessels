# vtkVolViewVessels (DEPRECATED)

Vessel viewer and segmentation editor.
Built using ITK+TubeTK, Python, and Electron.

## Setup

Checkout and initialize submodules:

```
git clone https://github.com/KitwareMedical/vtkVolViewVessels.git
git submodule init
git submodule update
```

### Software Dependencies

- Python 2. Python 3 support not yet tested.
- nodejs + npm. LTS version should suffice.

### Server setup

First build [ITKTubeTK](https://github.com/KitwareMedical/ITKTubeTK).
This build will take some time.

```
cd ITKTubeTK/
mkdir build && cd build/
cmake ..
make -j2 # change the -j switch as necessary
```

In the meantime, optionally setup a virtualenv.

```
virtualenv -p /usr/bin/python2 .venv
source .venv/bin/activate
```

You will need to install three python packages.

```
pip install twisted wslink numpy service_identity
```

### Desktop Client

Prepare and build the client and desktop code:

```
# build web client
cd vtkVolViewVessels/
git submodule init
git submodule update
npm install
npm run build

# prepare electron desktop app
cd electron/
npm install
```

## Running

Once the client and server has all been set up, you will need to edit
`electron/config.js`. Inside, you should set the appropriate variables.

- `PYTHON`: This is your python executable.
- `VIRTUALENV`: If you optionally set up a virtualenv, specify the root dir
                here. (Full paths preferred.)
- `ITK_TUBETK_ROOT`: This is the root dir of your build of ITKTubeTK. (Full
                     paths preferred.)
- `PORT`: If you want to specify the TCP port used for client/server
          communication, set it here.

Once you've configured `electron/config.js`, run the application like so:

```
cd electron/
npm run start
```

## Developing/Debugging

To open the devtools in electron, launch the application with the environment
variable `DEBUG=1`.
