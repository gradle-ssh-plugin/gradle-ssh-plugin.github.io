---
layout: page
title: Getting Started
---

This document explains how to use Gradle SSH Plugin version {{ site.product.version }}.


Requirement
-----------

Gradle SSH Plugin requires following:

* Java 6 or later
* Gradle 2.0 or later

Gradle 1.x is still supported with the backports library.
See later section for details.


Create a project
----------------

### Clone the template project

Get the [Gradle SSH Plugin Template Project](https://github.com/gradle-ssh-plugin/template) for quick start.
The project contains Gradle wrapper, so Gradle installation is not needed.

We can clone the template project as follows:

```sh
git clone https://github.com/gradle-ssh-plugin/template.git awesome-ssh
cd awesome-ssh
./gradlew tasks --all
```

We can open the project with an IDE such as IntelliJ IDEA.


### Use an existent project

Of course we can add the plugin to an existent project.


Add the plugin dependency
-------------------------

The plugin is available on the Gradle plugin registry.
Gradle will fetch the plugin from Internet.

Add the plugin to your script as follows:

```groovy
plugins {
  id 'org.hidetake.ssh' version '{{ site.product.version }}'
}
```

Gradle 2.0 style:

```groovy
buildscript {
  repositories {
    jcenter()
  }
  dependencies {
    classpath 'org.hidetake:gradle-ssh-plugin:{{ site.product.version }}'
  }
}

apply plugin: 'org.hidetake.ssh'
```


### Gradle 1.x support

The plugin also works on Gradle 1.x with the backports library:

```groovy
buildscript {
  repositories {
    jcenter()
  }
  dependencies {
    classpath 'org.hidetake:gradle-ssh-plugin:{{ site.product.version }}'
    classpath 'org.codehaus.groovy:groovy-backports-compat23:2.3.6'
  }
}

apply plugin: 'org.hidetake.ssh'
```

Gradle 1.x support is since [version 1.0.5](https://github.com/int128/gradle-ssh-plugin/releases/tag/v1.0.5)
and still experimental.


Add a remote host
-----------------

The plugin adds a container of remote hosts to the project.
One or more remote hosts can be added in the `remotes` closure.
A remote host can be associated with one or more roles.

Following code adds remote hosts to the remote hosts container:

```groovy
remotes {
  web01 {
    role 'masterNode'
    host = '192.168.1.101'
    user = 'jenkins'
  }
  web02 {
    host = '192.168.1.102'
    user = 'jenkins'
  }
}
```

We can specify each remote host by `remotes.web01` or `remotes.web02`.
Also we can specify the remote host _web01_ by a role such as `remotes.role('masterNode')`.

All settings of a remote host are available on [the user guide](/user-guide.html#add-a-remote-host).


Run a SSH session in the task
-----------------------------

Call `ssh.run` method to run one or more SSH sessions as follows.

```groovy
task checkWebServer << {
  ssh.run {
    session(remotes.web01) {
      //execute ...
    }
    session(remotes.web02) {
      //execute ...
    }
  }
}
```

`ssh.run` method will connect to all remote hosts, e.g. _web01_ and _web02_ in the above code,
and evaluate each closure of sessions in order.


### Obtain a result of command

`ssh.run` method will return the result of last declared session.
So we can use the method to retrieve a result of remote command as like:

```groovy
task syncKernelParam << {
  def paramKey = 'net.core.wmem_max'
  def paramValue = ssh.run {
    session(remotes.web01) {
      execute("sysctl '$paramKey' | sed -e 's/ //g'")
    }
  }
  assert paramValue.contains(paramKey)
  ssh.run {
    session(remotes.web02) {
      execute("sysctl -w '$paramValue'")
    }
  }
}
```


### More about sessions

A session consists of a remote host to connect and a closure.
Following code declares a session which connects to _web01_ and executes a command.

```groovy
session(remotes.web01) {
  //execute ...
}
```

If more than one remote hosts are given, the plugin will connect to all remote hosts at once and execute closures in order.
For instance, followings are all equivalent.

```groovy
session([remotes.web01, remotes.web02]) {
  //execute ...
}
```

```groovy
session(remotes.web01, remotes.web02) {
  //execute ...
}
```

```groovy
session(remotes.web01) {
  //execute ...
}
session(remotes.web02) {
  //execute ...
}
```

Also the session method accepts properties of the remote host without having to declare it on the remote container.

```groovy
session(host: '192.168.1.101', user: 'jenkins', identity: file('id_rsa')) {
  //execute ...
}
```


Describe SSH operations
-----------------------

We can describe SSH operations in the session closure.

```groovy
session(remotes.web01) {
  // Execute a command
  def result = execute 'uptime'

  // Any Gradle methods or properties are available in a session closure
  copy {
    from "src/main/resources/example"
    into "$buildDir/tmp"
  }

  // Also Groovy methods or properties are available in a session closure
  println result
}
```

Following methods are available in a session closure.

* `execute` - Execute a command.
* `executeBackground` - Execute a command in background.
* `executeSudo` - Execute a command with sudo support.
* `shell` - Execute a shell.
* `put` - Put a file or directory into the remote host.
* `get` - Get a file or directory from the remote host.

See [the user guide](/user-guide.html#perform-operations) for details.


Run the script
--------------

Now the script is ready.

```groovy
plugins {
  id 'org.hidetake.ssh' version '{{ site.product.version }}'
}

ssh.settings {
  dryRun = project.hasProperty('dryRun')
}

remotes {
  web01 {
    role 'webServers'
    host = '192.168.1.101'
    user = 'jenkins'
    identity = file('id_rsa')
  }
  web02 {
    role 'webServers'
    host = '192.168.1.102'
    user = 'jenkins'
    identity = file('id_rsa')
  }
}

task reload << {
  ssh.run {
    session(remotes.role('webServers')) {
      execute 'sudo service tomcat restart'
    }
  }
}
```

Invoke the task to run.

```sh
./gradlew reload
```


### Dry run the script

We can run the script without any actual connections.

Above script has already dry-run switch,
so invoke the task with `dryRun` property to perform dry-run.

```sh
./gradlew -PdryRun -i reload
```


Furthermore
-----------

See also [the user guide](/user-guide.html).
