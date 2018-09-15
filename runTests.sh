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
mkdir -p playground/folder/subfolder 2> /dev/null
echo "Hello world!" > playground/folder/hello.md
echo "a" > playground/folder/a.md
echo "b" > playground/folder/b.md

cd playground

# Clear the field
rm -Rfv .git

# Verify `init command`
.././src/index.ts init
# No assertions specified

# Verify `add` command
## Add several files and verify that the index is in good shape
.././src/index.ts add folder/hello.md
[[ $(git cat-file -p cd0875583aabe89ee197ea133980a9085d08e497) == "Hello world!" ]] || failure 'git add failed: blob folder/hello.md'
.././src/index.ts add folder/a.md
[[ $(git cat-file -p 78981922613b2afb6025042ff6bd878ac1994e85) == "a" ]] || failure 'git add failed: blob folder/a.md'
.././src/index.ts add folder/b.md
[[ $(git cat-file -p 61780798228d17af2d34fce4cfbdf35556832472) == "b" ]] || failure 'git add failed: blob folder/b.md'
## Verify index
[[ $(git ls-files | grep folder/hello.md) ]] || failure 'git index failed: folder/hello.md'
[[ $(git ls-files | grep folder/a.md) ]] || failure 'git index failed: folder/a.md'
[[ $(git ls-files | grep folder/b.md) ]] || failure 'git index failed: folder/b.md'


echo ""
echo "All tests run succesfully."
exit 0
