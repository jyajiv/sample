const {exec} = require('child_process');

const _ = require('lodash');

let destinationBranch = '';
let sourceBranch = '';

const baseRepo = 'jyajiv/sample';

let pullRequestMessage = 'Change report';

function createPR(destination, source) {
  sourceBranch = source;
  destinationBranch = destination;
  pullRequestMessage = `Git diff report for ${sourceBranch} and ${destinationBranch}`;
  commitAllChanges();
}

const gitPushCallback = (err, stdOut, stdIn) => {
  if (err) {
    if (!_.includes(_.get(err, 'message', ''), 'No staged files')) {
      throw err;
    }
  }
  console.log('Creating new Pull request ...');
  console.log(
    `hub pull-request -f -b ${baseRepo}:${destinationBranch} -h ${baseRepo}:${sourceBranch} -m '${pullRequestMessage}'`,
  );
  exec(
    `hub pull-request -f -b ${baseRepo}:${destinationBranch} -h ${baseRepo}:${sourceBranch} -m '${pullRequestMessage}'`,
    (error, output, input) => {
      if (error) {
        console.log('Error creating PR - ', error);
      } else {
        console.log('Pull request created successfully');
      }
    },
  );
};

function commitAllChanges() {
  console.log('Commiting any uncommitted changes...');
  console.log(
    `git add . && git commit -m '${pullRequestMessage}' && git push origin ${sourceBranch}`,
  );
  exec(
    `git add . && git commit -m '${pullRequestMessage}' && git push origin ${sourceBranch}`,
    gitPushCallback(),
  );
}

module.exports = {createPR};
