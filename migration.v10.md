---
layout: page
title: Migration Guide (from 0.4.x to 1.0.x)
---

# Migration Guide

This document explains how to migrate from 0.4.x to 1.0.x.


## No backward compatible changes

`sshexec` is no longer supported. Use `ssh.run` instead.

```groovy
task example << {
  // FIXME: sshexec is no longer supported
  sshexec {
    session(...) {...}
  }

  // use ssh.run instead
  ssh.run {
    session(...) {...}
  }
}
```

`ssh {}` is no longer supported. Use `ssh.settings {}` instead.

```groovy
// FIXME: ssh is no longer supported
ssh {
  knownHosts = allowAnyHosts
}

// use ssh.settings instead
ssh.settings {
  knownHosts = allowAnyHosts
}
```
