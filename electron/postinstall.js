var sh=require('shelljs');

sh.rm('-rf', 'web');
sh.mkdir('web');
sh.mkdir('web/www');
sh.cp('-rf', '../dist/*', 'web/www');
sh.mkdir('web/server');
sh.cp('-rf', '../server/*', 'web/server');
