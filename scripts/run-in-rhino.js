const child_process = require('child_process');

const RHINO_JAR_PATH = 'C:\\Users\\jichan\\Downloads\\rhino-1.7.14.jar';

const args = [
  '-jar', RHINO_JAR_PATH,
  '-version', '200',
  process.argv[2]
];
child_process.spawnSync(
  'java',
  args,
  {
    stdio: 'inherit'
  }
);

