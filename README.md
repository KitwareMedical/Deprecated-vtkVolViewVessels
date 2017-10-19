# itk-tube-web

## Setup


### Web Client

For starting the development server:

```
npm run build
npm run start
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
pip install twisted wslink
```

Once the build is done, copy `run.sh.example` to `run.sh`. Edit the first two lines for
your current environment. The `ITKBuildRoot` points to the build directory of ITKTubeTK.
The `source...` line points to the activate script of your virtualenv. 

Once that is set up, run `./run.sh server/itk-tube.py`. Note that the run script isn't
required. If your environment exports all the needed variables from the run script,
then the run script is not needed.
