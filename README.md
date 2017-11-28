# vtkVolViewVessels

## Setup

Checkout and initialize submodules:

```
git clone https://github.com/KitwareMedical/vtkVolViewVessels.git
git submodule init
```

### Dependencies

- Python 2. Python 3 support not yet tested.
- nodejs + npm. LTS version should suffice.

### Desktop Client

Prepare and build the client and desktop code:

```
# build client
cd vtkVolViewVessels/
npm install
npm run build

# prepare desktop
cd electron/
npm install
```

### Server

First build [ITKTubeTK](https://github.com/floryst/ITKTubeTK/tree/swig_python_threads).
This build will take some time.

```
cd ITKTubeTK/
mkdir build && cd build/
cmake ..
make -j2 # change the -j switch for your machine
```

In the meantime, optionally setup a virtualenv. Currently this has been tested only
with Python 2. Python 3 support has not yet been tested. Install `twisted` and `wslink`.

```
virtualenv -p /usr/bin/python2 .venv
source .venv/bin/activate
pip install twisted wslink numpy
```

Once the build is done, copy `run.sh.example` to `run.sh`. Edit the first two lines for
your current environment. The `ITKBuildRoot` points to the build directory of ITKTubeTK.
The `source...` line points to the activate script of your virtualenv. 

Once that is set up, run `./run.sh server/server.py`. Note that the run script isn't
required. If your environment exports all the needed variables from the run script,
then the run script is not needed.

## Running

Once the client and server has all been set up, first run the server. Then,
from another terminal, run the desktop application.

```
# terminal 1
./run.sh server/server.py

# terminal 2
cd electron/
npm run start
```

For Windows machines, use `run.bat` accordingly.
