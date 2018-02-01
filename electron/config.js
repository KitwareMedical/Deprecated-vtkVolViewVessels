module.exports = {

// NOTE: For all paths specified, if on Windows please use backslashes.

/**
 * This is your python executable. If the entry is not a full path, then
 * the PATH environment variable is searched.
 */
PYTHON: '/Users/aylward/Anaconda3/python.exe',

// If you have a custom python install on on Windows, specify the path like so:
//PYTHON: 'c:\Python\bin\python.exe',

/**
 * (OPTIONAL) The path to the python virtualenv root that has the
 * server dependencies.
 */

// If not using a virtualenv, set to the empty string
VIRTUALENV: '',

// if using a virtualenv, set to the root dir of the virtualenv
//VIRTUALENV: '/path/to/.venv/',

/**
 * The path to the ITK build root.
 */

ITK_ROOT: '/src/ITK-Release',
// if built ITKTubeTK using superbuild, set ITK_ROOT to the empty string.

/**
 * The path to the ITKTubeTK build root.
 */

ITK_TUBETK_ROOT: '/src/ITKTubeTK-Release',

/**
 * (OPTIONAL) Port for the server to bind to. If 0, then a random port will
 * be chosen.
 *
 * Note: If you want to specify a port on Linux or OS X, please do not bind
 * to a port below 1024. You must be root to do so, and this application should
 * NOT be run as root.
 */

PORT: 0,

};
