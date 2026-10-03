#!/bin/sh
# sync deliverable files into the build mirror and bundle the app
cd /home/claude/ui
for f in App.jsx StoryShell.jsx storyCopy.js MaxwellSection.jsx ThreeGenSection.jsx ShapesSection.jsx EquationsSection.jsx equationsData.js equationsCopy.js equationsSelfcheckSource.js GossetSection.jsx gossetData.js gossetCopy.js gossetSelfcheckSource.js shapesData.js shapesCopy.js shapesWitt.js shapesSelfcheckSource.js threegenData.js threegenSelfcheckSource.js matrixData.js storyOverrides.js genesisStory.js; do [ -f /home/claude/out/$f ] && cp /home/claude/out/$f . ; done
/opt/npm-tools/node_modules/.bin/esbuild harness_app.jsx --bundle --outfile=dist/app.js --loader:.js=jsx --alias:streamdown=./stubs/streamdown.jsx --alias:@streamdown/math=./stubs/smath.js --alias:react-katex=./stubs/katex.jsx --define:process.env.NODE_ENV='"production"' --log-level=warning
