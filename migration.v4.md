---
layout: page
title: Migration Guide (from 0.3.x to 0.4.x)
---

# Migration Guide

This document explains how to migrate from 0.3.x to 0.4.x.


## Introduction

Since 0.4.0, core code has been separated to the SSH library
[groovy-ssh](https://github.com/int128/groovy-ssh) and removed from the plugin.

It introduces new style which is common between the plugin and the SSH library.
It also causes no backward compatible changes.

Please let me know if there is any problem.


## New style

### Global settings

`ssh` method has been deprecated.

```groovy
ssh {
  // apply global settings here
}
```

Instead, use `ssh.settings`.

```groovy
ssh.settings {
  // apply global settings here
}
```

### SSH execution

`SshTask` and `sshexec` method have been deprecated.

```groovy
// Deprecated
task testTask1(type: SshTask) {
  ssh {
    dryRun = true
  }
  session(remotes.webServer) {
    execute 'ls'
  }
}
```

```groovy
task testTask1 << {
  // Deprecated
  sshexec {
    ssh {
      dryRun = true
    }
    session(remotes.webServer) {
      execute 'ls'
    }
  }
}
```

Instead, use `ssh.run` method in the task.

```groovy
task testTask1 << {
  ssh.run {
    settings {
      // apply one-time settings here
      dryRun = true
    }
    session(ssh.remotes.webServer) {
      // describe operations here
      execute 'ls'
    }
  }
}
```


## No backward compatible changes

### Logging settings

Following settings have been removed.

Key              | Type     | Description
-----------------|----------|------------
`outputLogLevel` | LogLevel | Log level of the standard output on the command or shell execution. Default is `LogLevel.QUIET`.
`errorLogLevel`  | LogLevel | Log level of the standard error on the command or shell execution. Default is `LogLevel.ERROR`.

Instead use `logging` setting to enable verbose logging.

Key              | Type     | Description
-----------------|----------|------------
`logging`        | String   | If this is `slf4j`, console log of the remote command is sent to Gradle logger. If this is `stdout`, it is sent to standard output/error. If this is `none`, console logging is turned off. Defaults to `slf4j`.

e.g.

```groovy
ssh.settings {
  logging = 'stdout'
}
ssh.run {
}
```
