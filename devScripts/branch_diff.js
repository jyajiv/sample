const { exec } = require('child_process');
const fs = require('fs');

// const getModuleNames = require('./getModuleName');
const diffPR = require('./createDiffPR');

const branches = process.argv.slice(2);
const gitDiffCommand = `git diff ${branches[0]}..${branches[1]} --name-only`;
const DESTINATION = `${branches[1]}`;
const asyncCallback = callback => (err, stdout, stdin) => {
  if (err) {
    throw err;
  } else {
    const diff = stdout
      .toString()
      .split('\n')
      .slice(0, -1);

    // console.log(`Branch 1 : ${branches[0]}`);
    // console.log(`Branch 2 : ${branches[1]}`);
    // console.log(`Number of modified files : ${diff.length}`);
    // console.log('Output:');
     console.log(diff);
    // getModuleNames.getAllImpactedModules(diff, DESTINATION, () => {
    //   diffPR.createPR(branches[0], branches[1]);
    // });
    fs.writeFile(variantProfileLocation, diff, err => {
      console.log('File created', err);
      diffPR.createPR(branches[0], branches[1]);
    });
  }
};

const executeCommand = () => {
  exec(gitDiffCommand, asyncCallback());
};

if (branches.length === 2) {
  executeCommand(branches[0], branches[1]);
} else {
  console.log('\x1b[31m%s\x1b[0m: ', '****Please enter 2 branches for diff****');
}
