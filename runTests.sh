#! /bin/bash

function failure() {
  tput setaf 9 # set text color to red
  echo 'Failure: ' $1
  tput sgr0 # reset text color
  exit 1
}

mkdir playground 2&> /dev/null
cd playground

# Clear the field
rm -Rfv .git

# Verify `init command`
.././src/index.ts init
# No assertions specified

# Verify `add` command
.././src/index.ts add folder/hello.md
[[ "git cat-file -p cd0875583aabe89ee197ea133980a9085d08e497" == "Hello world!" ]] && failure 'git add failed'

echo ""
echo "All tests run succesfully."
exit 0
