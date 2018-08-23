
List of files in `.git` after initializing the database by `find .git`.

```
.git
.git/config
.git/description
.git/HEAD
.git/hooks
.git/hooks/applypatch-msg.sample
.git/hooks/commit-msg.sample
.git/hooks/post-update.sample¨
.git/hooks/pre-applypatch.sample
.git/hooks/pre-commit.sample
.git/hooks/pre-push.sample
.git/hooks/pre-rebase.sample
.git/hooks/pre-receive.sample
.git/hooks/prepare-commit-msg.sample
.git/hooks/update.sample
.git/info
.git/info/exclude
.git/objects
.git/objects/info
.git/objects/pack
.git/refs
.git/refs/heads
.git/refs/tags
```

There's some files such as `config` but mostly just empty directories. The entire [Git Repository Layout](https://git-scm.com/docs/gitrepository-layout) is extensively documented on its man page.


`.git/config` stores the Git configuration such as user info but also information for the remotes and such.

`.git/description` is actually not covered by the man page. [According to Stack Overflow answer by manojlds](https://stackoverflow.com/a/6866883/499798) that it's typically used to denote a **blessed** repository where the GitWeb reads repository information. Personally, never used GitWeb so `.git/description` has always been useless to me. I'd guess that Github is using this for the repo descriptions. It's doesn't sync between the clones of the repository so the use cases are limited.

`./git/hooks and the .samples` is the directory for the all hooks for different Git actions. All the `.sample` are obviously samples including instructions for all the things you can do. So if you want to do a pre-commit hook for running you linter, here's the place to do it.

`.git/info` is the place where additional information about the repository is recorded. That's what the man page says. I know, sounds a bit vague.

`.git/info/excludes` is surprisingly interesting file. It stores the exclude pattern for the high-level, user facing Git command such as `git status`, `git add`, `git rm` and `git clean`. The difference from `.gitignore` seems to be that this is repository wide(?) but `.gitignore` is directory (including sub-directories) specific exclusion list.

`.git/objects` directory contains (or rather will contain) all the files you add to Git as well as all the commits and tags.

`.git/objects/info` according to the man page additional information about the object store is recorded here. Frankly I have no idea what that might be.

`.git/objects/info/packs` file contains dump transport to discover what packs available in the store. (Basically just helping out the object synchronization between repos?)

`.git/refs/{heads, tags}`. These directories contains files where the SHA-1 hashes of the branch heads or tags are contain. These are used you checkout a branch or tag as quick links to those referenced commits.

## `.git/config` the default values

```
[core]
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
        ignorecase = true
        precomposeunicode = true
```

`repositoryformatversion = 0` defines the repository format and layout version. Since it's 0 I suspect the format and layout haven't changed ever.

`filemode = true` is a bit more interesting option that the `repositoryformatversion`. Filemode tells Git if it should respect the executable bit of the files in the working tree. Apparently on some filesystems files might lose or gain executable bit incorrectly and this options is trying to keep the bit on when needed by probing the file system.

`bare = false` is the repository a bare repo or not. A bare repository doesn't have a working tree and is meant for sharing the repos. http://www.saintsjd.com/2011/01/what-is-a-bare-git-repository/

`logallrefupdates = true` enables or disables reflog. Reflog allows keeping track of updates to the head of branches by using logs. The logs are written to `./git/logs/`. With reflog you can see what the head of branch was 2 weeks ago. It can also be used to recover lost commits.

`ignorecase = true` Simple. Should Git ignore case or not. By default it is `false`.

`precomposeunicode` is only used on macOS to revert the unicode decomposition of file names.
