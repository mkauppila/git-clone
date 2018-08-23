# `git add`

https://git-scm.com/book/az/v1/Git-Internals-Git-Objects)

# Object types

Blob, tree, commit and tag (lightweight and annotated)?

Lighweight is basically a branch that never changes. It just keeps on pointing to a specific commit. Annotated tag is a commit pointing to a commit. So it can have metadata about the tagger.

Interestingly "Notice that the object entry points to the commit SHA-1 value that you tagged. Also notice that it doesn’t need to point to a commit; you can tag any Git object. In the Git source code, for example, the maintainer has added their GPG public key as a blob object and then tagged it."

All the content is stored as tree and blob objects, with trees corresponding to UNIX directory entries and blobs corresponding more or less to inodes or file contents. (https://git-scm.com/book/az/v1/Git-Internals-Git-Objects)

Git creates the tree object during commit and not during the `git add` action.

Then you'll have
for a text file: `./folder/hello.md`

blob: hello.md
tree 1: referencing to hello.md (its hash, filename and permissions + type)
tree 2: referencing folder `./folder` (its permissions?, type, hash of `tree 1`, folder name)
commit: all commit data and referencing the `tree 2`

commit: referecing the tree

A directory becomes a tree that references its contents.

"In this case, you’re specifying a mode of 100644, which means it’s a normal file. Other options are 100755, which means it’s an executable file; and 120000, which specifies a symbolic link. The mode is taken from normal UNIX modes but is much less flexible — these three modes are the only ones that are valid for files (blobs) in Git (although other modes are used for directories and submodules)." (https://git-scm.com/book/az/v1/Git-Internals-Git-Objects)

# Trees
