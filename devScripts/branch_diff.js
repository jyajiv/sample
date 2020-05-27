const {exec} = require('child_process');

const getModuleNames = require('./getModuleName');
const diffPR = require('./createDiffPR');

let branches = process.argv.slice(2);

const asyncCallback = callback => (err, stdout, stdin) => {
  if (err) {
    console.log(err);
    throw err;
  } else {
    const diff = stdout
      .toString()
      .split('\n')
      .slice(0, -1);

    console.log(`Branch 1 : ${branches[0]}`);
    console.log(`Branch 2 : ${branches[1]}`);
    console.log(`Number of modified files : ${diff.length}`);
    console.log('Output:');
    console.log(diff);
    getModuleNames.getAllImpactedModules(diff, () => {
      console.log('callback success');
      diffPR.createPR(branches[0], branches[1]);
    });
  }
};

const executeCommand = () => {
  exec(`git diff ${branches[0]}..${branches[1]} --name-only`, asyncCallback());
};

if (branches.length === 2) {
  executeCommand(branches[0], branches[1]);
} else {
  console.log(
    '\x1b[31m%s\x1b[0m: ',
    '****Please enter 2 branches for diff****',
  );
  console.log(
    '****  Missing one or both brach names. Hence comparring current branch with its parent. ****',
  );
  branches = ['', ''];
  getBranchDetails();
}

const currentBranchCallBack = (error, output, input) => {
  if (error) {
    throw error;
  } else {
    branches[0] = 'codepush_2.0'; //output.trim();
    console.log('previous Branch is ', output.trim());
    executeCommand(branches[0], branches[1]);
  }
};

function getBranchDetails() {
  exec(
    `git symbolic-ref HEAD 2>/dev/null | cut -d"/" -f 3,4,5`,
    (error, output, input) => {
      if (error) {
        throw error;
      } else {
        branches[1] = 'release/codepush_2.0'; //output.trim();
        console.log('Current branch is ', output.trim());
        exec(
          `git show-branch | grep "*" | grep -v "$(git rev-parse --abbrev-ref HEAD)" | head -n1 | sed "s/.*\\[\\(.*\\)\\].*/\\1/" | sed "s/[\\^~].*//"`,
          currentBranchCallBack,
        );
      }
    },
  );
}
