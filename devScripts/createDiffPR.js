const {exec} = require('child_process');
const fs = require('fs');

// const _ = require("lodash");

let currentBranch = '';
let previousBranch = '';
let currentUserFork = '';

const baseRepo = 'praveenkumarc86/caribou';
let pullRequestMessage = 'Change report';

createPR('release/20.5.0', 'release/20.5.0');

function getGitUserInfo() {
  exec(
    `git show-branch | grep "*" | grep -v "$(git rev-parse --abbrev-ref HEAD)" | head -n1 | sed "s/.*\\[\\(.*\\)\\].*/\\1/" | sed "s/[\\^~].*//"`,
    (error, output, input) => {
      if (error) {
        throw error;
      } else {
        previousBranch = output.trim();
        console.log('previous Branch is ', previousBranch);
      }
    },
  );

  exec(
    `git symbolic-ref HEAD 2>/dev/null | cut -d"/" -f 3,4,5`,
    (error, output, input) => {
      if (error) {
        throw error;
      } else {
        currentBranch = output.trim();
        console.log('Current branch is ', currentBranch);
        exec(
          `git remote get-url origin | cut -d"/" -f 4`,
          (err, stdOut, stdIn) => {
            if (err) {
              throw err;
            } else {
              currentUserFork = `${stdOut.trim()}/example-services`;
              console.log('Current User is ', currentUserFork);
              getGitUserDetailsCallback();
            }
          },
        );
      }
    },
  );
}

function createPR(sourceBranch, destinationBranch) {
  pullRequestMessage = `Git diff report for ${sourceBranch} and ${destinationBranch}`;
  getGitUserInfo();
}

const gitPushCallback = callback => (err, stdOut, stdIn) => {
  if (err) {
    // if (!_.includes(_.get(err, "message", ""), "No staged files")) {
    console.log(err);
    throw err;
    //  }
  }
  console.log('Creating new Pull request ...');
  console.log(
    `hub pull-request -f -b ${currentUserFork}:${previousBranch} -h ${currentUserFork}:${currentBranch} -m '${pullRequestMessage}'`,
  );
  exec(
    `hub pull-request -f -b ${currentUserFork}:${previousBranch} -h ${currentUserFork}:${currentBranch} -m '${pullRequestMessage}'`,
    (error, output, input) => {
      if (error) {
        console.log('Error creating PR - ', error);
      } else {
        console.log('Pull request created successfully');
      }
    },
  );
};

function getGitUserDetailsCallback() {
  console.log('Fetch git repo details successfull');
  console.log(
    `git add . && git commit -m '${pullRequestMessage}' && git push origin HEAD:${currentBranch}`,
  );
  fs.writeFile('./test.txt', `this is the diff report${new Date()}`, err => {
    console.log('File created', err);
    exec(
      `git add . && git commit -m '${pullRequestMessage}' && git push origin HEAD:${currentBranch}`,
      gitPushCallback(),
    );
  });
}

module.exports = {createPR};
