#! /bin/bash

function failure() {
  tput setaf 9 # set text color to red
  echo 'Failure: ' $1
  tput sgr0 # reset text color
  exit 1
}

rm -Rfv playground
mkdir -p playground 2> /dev/null
mkdir -p playground/folder 2> /dev/null
echo "Hello world!" > playground/folder/hello.md

cd playground

# Clear the field
rm -Rfv .git

# Verify `init command`
.././src/index.ts init
# No assertions specified

# Verify `add` command
.././src/index.ts add folder/hello.md
[[ $(git cat-file -p cd0875583aabe89ee197ea133980a9085d08e497) == "Hello world!" ]] || failure 'git add failed: blob'
[[ $(git ls-files -X folder/hello.md) ]] || failure 'git index failed'


echo ""
echo "All tests run succesfully."
exit 0
