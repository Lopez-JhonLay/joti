const { withAppBuildGradle } = require('expo/config-plugins');

const marker = '// Joti: shorten Windows CMake object paths';
const configuration = `
${marker}
if (System.getProperty("os.name").toLowerCase().contains("windows")) {
    android {
        defaultConfig {
            externalNativeBuild {
                cmake {
                    arguments "-DCMAKE_OBJECT_PATH_MAX=240"
                }
            }
        }
        externalNativeBuild {
            cmake {
                buildStagingDirectory new File(rootDir, "../.cxx")
            }
        }
    }
}
`;

module.exports = function withWindowsNativePaths(config) {
  return withAppBuildGradle(config, (result) => {
    if (result.modResults.language !== 'groovy') {
      throw new Error(
        'Joti Windows native path configuration requires Groovy build.gradle.',
      );
    }
    if (!result.modResults.contents.includes(marker)) {
      result.modResults.contents += configuration;
    }
    return result;
  });
};
