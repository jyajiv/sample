const fs = require('fs');

const xlsx = require('node-xlsx');
const _ = require('lodash');

const androidKeys = {
  'android/app/libs': 'ANDROID_NATIVE_LIBRARIES',
  'android/libs': 'ANDROID_NATIVE_LIBRARIES',
  'android/misnapworkflow': 'ANDROID_NATIVE_MISNAP',
  'android/app/src/main/res': 'ANDROID_NATIVE_RESOURCES',
  'android/app/src/ProductionRelease': 'ANDROID_NATIVE_PRODUCTION_RELEASE',
  'android/discoverWear': 'ANDROID_NATIVE_WEAR',
  'android/wearable': 'ANDROID_NATIVE_WEAR',
};
const iOSKeys = {
  'ios/Frameworks/': 'IOS_NATIVE_FRAMEWORKS',
  'ios/PodFile': 'IOS_NATIVE_LIBRARIES',
  'ios/GemFile': 'IOS_NATIVE_LIBRARIES',
  'ios/DiscoverAnalytics/': 'IOS_NATIVE_ANALYTICS',
  'ios/DiscoverCore/': 'IOS_NATIVE_CORE',
  'ios/DiscoverCoreUI/': 'IOS_NATIVE_COREUI',
  'ios/DiscoverFeatureServices/': 'IOS_NATIVE_FEATURESERVICES',
  'ios/DiscoverIntentsExtension/': 'IOS_NATIVE_INTENTEXT',
  'ios/DiscoverIntentsExtensionUI/': 'IOS_NATIVE_INTENTEXTUI',
  'ios/DiscoverServiceLayer/': 'IOS_NATIVE_SERVICELAYER',
  'ios/DiscoverUtils/': 'IOS_NATIVE_UTILS',
  'ios/DiscoverWatchKitApp/': 'IOS_NATIVE_WATCHKIT',
  'ios/DiscoverWatchKitExtension/': 'IOS_NATIVE_WATCHKITEXT',
  'ios/DiscoverWidget/': 'IOS_NATIVE_WIDGET',
};

const UI_Type_Keys = {
  'Screen.js': '_UI',
  'Modal.js': '_UI',
  'Item.js': '_UI',
  'Form.js': '_UI',
  'Picker.js': '_UI',
  'Tile.js': '_UI',
  'Header.js': '_UI',
  'View.js': '_UI',
  'PageSheet.js': '_UI',
};

const API_Type_Keys = {
  'Api.js': '_API',
};

const FLOW_Type_Keys = {
  'Util.js': '_FLOW',
  'Utils.js': '_FLOW',
  'Actions.js': '_FLOW',
  'TypeDefinitions.js': '_FLOW',
  'Selector.js': '_FLOW',
  'Selectors.js': '_FLOW',
  'Types.js': '_FLOW',
  'Action.js': '_FLOW',
  'Reducer.js': '_FLOW',
  'Reducers.js': '_FLOW',
  'Routes.js': '_FLOW',
  'Constant.js': '_FLOW',
  'Constants.js': '_FLOW',
  'Enums.js': '_FLOW',
};

function getAllImpactedModules(fileList, callBackFunction) {
  const modulesList = new Set();
  const moduleDetails = [];
  fileList.forEach(filePath => {
    try {
      // const myRegexp = /(?:^|\s)js\/ (.*?)(?:\*|\n|$)/g;
      const filePathArray = filePath.split('/');

      if (
        filePathArray[filePathArray.length - 2] !== '__tests__' &&
        filePathArray[filePathArray.length - 2] !== '__test__' &&
        filePathArray[2] !== 'uiExplorer' &&
        filePathArray[0] !== 'midway' &&
        filePathArray[0] !== 'apps' &&
        filePathArray[0] !== 'devScripts' &&
        filePathArray[0] !== 'docs' &&
        filePathArray[0] !== 'e2e'
      ) {
        const moduleName = fetchModuleName(filePath, filePathArray);

        if (!!moduleName) {
          modulesList.add(moduleName.trim());
          moduleDetails.push([moduleName.trim(), filePath]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  moduleDetails.sort((moduleName1, moduleName2) => {
    if (_.lowerCase(moduleName1[0]) < _.lowerCase(moduleName2[0])) {
      return -1;
    }
    if (_.lowerCase(moduleName1[0]) > _.lowerCase(moduleName2[0])) {
      return 1;
    }
    return 0;
  });

  // Creating an XL with the list of files that are changed, along with their corresponding module names
  const writeStream = fs.createWriteStream('Impacted_Files_List.xlsx');
  const data = [['ModuleName', 'FilePath']];
  data.push(...moduleDetails);
  const options = { '!cols': [{ wch: 20 }, { wch: 60 }] };
  const buffer = xlsx.build([{ name: 'mySheetName', data }], options);
  writeStream.write(buffer);
  writeStream.close();

  // Creating an XL with the Unique set of modules that are changed
  const sortedModuesList = [['Module Name']];
  Array.from(modulesList)
    .sort()
    .forEach(item => {
      sortedModuesList.push([item]);
    });
  const modulesListWriteStream = fs.createWriteStream('Impacted_Modules_List.xlsx');
  const writeBuffer = xlsx.build([{ name: 'Module list', data: sortedModuesList }], {
    '!cols': [{ wch: 50 }],
  });
  modulesListWriteStream.write(writeBuffer);
  modulesListWriteStream.close();

  callBackFunction();
}

function fetchModuleName(filePath, filePathArray) {
  let moduleName;
  if (_.endsWith(filePath, '.js')) {
    if (
      (filePathArray[0] === 'js' && filePathArray[1] === 'lib') ||
      filePathArray[1] === 'middleware' ||
      filePathArray[1] === 'store'
    ) {
      moduleName = 'FRAMEWORK_UTILITIES';
    } else if (filePathArray[0] === 'js' && filePathArray[2] === 'uiExplorer') {
      moduleName = 'UI_EXPLORER';
    } else if (filePathArray[0] === 'js') {
      moduleName = fetchModuleNameFromPath(filePathArray);
    }
  } else if (_.startsWith(filePath, 'android/')) {
    moduleName = 'ANDROID_NATIVE_MISC';

    _.forEach(androidKeys, (value, key) => {
      if (_.startsWith(filePath, 'android/app/src/main/java')) {
        moduleName = fetchAndroidModuleName(filePathArray);
      } else if (_.startsWith(filePath, key)) {
        moduleName = value;
      }
    });
  } else if (_.startsWith(filePath, 'ios/')) {
    moduleName = 'IOS_NATIVE_MISC';

    _.forEach(iOSKeys, (value, key) => {
      if (_.startsWith(filePath, 'ios/DiscoverFinancial/')) {
        moduleName = fetchIOSModuleName(filePathArray);
      } else if (_.startsWith(filePath, key)) {
        moduleName = value;
      }
    });
  } else if (_.startsWith(filePath, 'packages/') || _.startsWith(filePath, 'localPackages/')) {
    moduleName = 'DISCOVER_FRAMEWORK';
  } else if (_.startsWith(filePath, 'package.json') || _.startsWith(filePath, 'yarn.lock')) {
    moduleName = 'RN_LIBRARIES';
  } else {
    moduleName = 'MISC';
  }

  return moduleName;
}

function fetchModuleNameFromPath(filePathArray) {
  const moduleText = findModuleText(filePathArray);
  const moduleType = findModuleType(filePathArray);
  const moduleName = `${filePathArray[1]}_${moduleText}${moduleType}`;
  return _.isEmpty(moduleName) ? '' : moduleName.toUpperCase();
}

function findModuleText(filePathArray) {
  if (
    filePathArray[filePathArray.length - 2] === 'helper' &&
    filePathArray[filePathArray.length - 3] === 'uni'
  ) {
    return filePathArray[filePathArray.length - 4];
  } else if (
    filePathArray[filePathArray.length - 2] === 'components' ||
    filePathArray[filePathArray.length - 2] === 'examples'
  ) {
    return filePathArray[filePathArray.length - 3];
  } else {
    return filePathArray[filePathArray.length - 2];
  }
}

function findModuleType(filePathArray) {
  const filename = filePathArray[filePathArray.length - 1];
  let moduleType = '_MISC';
  _.forEach(UI_Type_Keys, (value, key) => {
    if (filename.includes(key)) {
      moduleType = value;
    }
  });
  _.forEach(API_Type_Keys, (value, key) => {
    if (filename.includes(key)) {
      moduleType = value;
    }
  });
  _.forEach(FLOW_Type_Keys, (value, key) => {
    if (filename.includes(key)) {
      moduleType = value;
    }
  });
  return moduleType;
}

function fetchAndroidModuleName(filePathArray) {
  const moduleText = findModuleText(filePathArray);
  const moduleName = `ANDROID_NATIVE_${moduleText}`;
  return _.isEmpty(moduleName) ? '' : moduleName.toUpperCase();
}

function fetchIOSModuleName(filePathArray) {
  const moduleText = findModuleText(filePathArray);
  const moduleName = `IOS_NATIVE_${moduleText}`;
  return _.isEmpty(moduleName) ? '' : moduleName.toUpperCase();
}

module.exports = { getAllImpactedModules };
