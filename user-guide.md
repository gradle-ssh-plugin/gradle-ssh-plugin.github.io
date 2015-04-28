---
layout: page
title: User Guide
---


Overview
--------

Gradle SSH Plugin is a Gradle plugin which provides remote execution and file transfer features.

This document is for version 1.1.x.

Please read [the getting started](/getting-started.html) at first time.

See also:

* [Migration Guide from 1.0.x to 1.1.x](/migration.v11.html)
* [Migration Guide from 0.4.x to 1.0.x](/migration.v10.html)
* [Migration Guide from 0.3.x to 0.4.x](/migration.v4.html)
* [User Guide (version 1.0.x)](/user-guide.v10.html)
* [User Guide (version 0.4.x)](/user-guide.v4.html)
* [User Guide (version 0.3.x)](/user-guide.v3.html)


Manage remote hosts
-------------------

The plugin adds a container of remote hosts to the project.
The remote hosts container is
an [NamedDomainObjectContainer](http://www.gradle.org/docs/current/javadoc/org/gradle/api/NamedDomainObjectContainer.html)
and has role support methods extended by the plugin.


### Add a remote host

Following code adds a remote host to the remote hosts container:

```groovy
remotes {
  web01 {
    host = '192.168.1.101'
    user = 'jenkins'
  }
}
```

Following settings can be set in a remote closure.

Key       | Type              | Description
----------|-------------------|------------
`host`    | String, Mandatory | Hostname or IP address.
`port`    | Integer           | Port. Defaults to 22.
`gateway` | Remote            | Gateway remote host. If this is set, port-forwarding tunnel will be used on connection.
`proxy`   | Proxy             | Proxy server. If this is set, the connection will use the proxy server to reach the remote host.


#### Set connection settings

Also following settings can be set in a remote closure. These can be set globally in the project.

Key            | Type              | Description
---------------|-------------------|------------
`user`         | String, Mandatory | User name.
`password`     | String            | A password for password authentication.
`identity`     | File              | A private key file for public-key authentication.
`passphrase`   | String            | A pass-phrase of the private key. This can be null.
`agent`        | Boolean           | If this is set, Putty Agent or ssh-agent will be used on authentication.
`knownHosts`   | File              | A known hosts file. Defaults to `~/.ssh/known_hosts`. If `allowAnyHosts` is set, strict host key checking is turned off (only for testing purpose).
`retryCount`   | Integer           | Retry count to establish connection. Defaults to 0 (no retry).
`retryWaitSec` | Integer (seconds) | Interval time between each retries. Defaults to 0 (immediately).


#### Connect through gateway servers

A remote host can be connected through one or more gateway servers.

##### Through one gateway

```groovy
remotes {
  gw01 {
    host = '10.2.3.4'
    user = 'gwuser'
  }
  web01 {
    host = '192.168.1.101'
    user = 'jenkins'
    gateway = remotes.gw01
    knownHosts = allowAnyHosts
  }
}
```

It will:
* establish a connection to `10.2.3.4` (gw01) and request a port-fowarding tunnel from local port (automatically allocated; as X) to `192.168.1.101:22`.
* establish a connection to `127.0.0.1:X` (web01) and perform operations such as command execution or file transfer.

##### Through two-hop gateways

```groovy
remotes {
  frontgw01 {
    host = '10.2.3.4'
    user = 'frontgwuser'
  }
  gw01 {
    host = '172.16.1.2'
    user = 'gwuser'
    gateway = remotes.frontgw01
  }
  web01 {
    host = '192.168.1.101'
    user = 'jenkins'
    gateway = remotes.gw01
  }
}
```

It will:
* establish a connection to `10.2.3.4` (frontgw01) and request a port-fowarding tunnel from local port (automatically allocated; as X) to `172.16.1.2:22`.
* establish a connection to `127.0.0.1:X` (gw01) and request a port-fowarding tunnel from local port (automatically allocated; as Y) to `192.168.1.101:22`.
* establish a connection to `127.0.0.1:Y` (web01) and perform operations such as command execution or file transfer.

##### Limitation

Strict host key checking must be turned off for remote hosts over the gateway.
Because the gateway connection is achieved with the port forwarding, `known_hosts` does not work.


#### Connect through a proxy server

A remote host can specify that connections should be made through a proxy server.
Individual proxy server connections are configured in the `proxies` container provided by the plugin.

The following code adds a proxy server to the `proxies` container:

```groovy
proxies {
  socks01 {
    host = '192.168.1.112'
    port = 1080
    type = SOCKS
  }
}
```

The following settings are used to configure how a proxied connection is established within a proxy closure.

Key            | Type                 | Description
---------------|----------------------|------------
`host`         | String, Mandatory    | Hostname or IP address.
`port`         | Integer, Mandatory   | Port.
`type`         | ProxyType, Mandatory | Type of proxy server: `SOCKS`or `HTTP`.
`user`         | String               | Proxy server user name.
`password`     | String               | Proxy server password.
`socksVersion` | Integer              | Protocol version when using `SOCKS`: 4 or 5. Defaults to 5.

Once a proxy server is defined in the `proxies` container,
it can be referenced per-remote, per-method or globally.
Unless the remote's proxy property is set in a higher scope, connections made to that host will not be proxied.

The following code shows how remote hosts can use different proxy servers.

```groovy
proxies {
  socks {
    host = '192.168.1.112'
    port = 1080
    user = 'admin'
    password = '0t1s'
    type = SOCKS
    socksVersion = 5
  }

  http {
    host = '192.168.1.113'
    port = 8080
    type = HTTP
  }
}

remotes {
  web01 {
    host = '192.168.1.101'
    user = 'jenkins'
    proxy = proxies.http
  }

  web02 {
    host = '192.168.1.102'
    user = 'jenkins'
    proxy = proxies.socks
  }
}
```

The following shows how to set a global proxy server.

```groovy
ssh.settings {
  // All remotes will use this proxy by default.
  // Each remote can override this configuration.
  proxy = proxies.socks01
}
```

The following shows how to set a proxy server on a particular method.

```groovy
task jarSearch << {
  ssh.run {
    settings {
      proxy = proxies.http01
    }
    session(remotes.role('mavenRepo')) { ... }
  }
}
```


### Associate with roles

Call `role` method to associate the host with one or more roles.

```groovy
remotes {
  web01 {
    role('webServers')
    role('all')
    host = '192.168.1.101'
    user = 'jenkins'
  }
}
```

We can specify one or mote roles on a session.

```groovy
session(remotes.role('all')) {
  //execute ...
}

session(remotes.role('webServer', 'appServer')) {
  //execute ...
}
```


### Manipulate on execution phase

A remote host can be defined on execution phase by `remotes.create(name)`.

```groovy
task setupRemote << {
  ssh.run {
    session(remotes.web01) {
      def targetHost = execute 'cat settings/hostname'
      def targetUser = execute 'cat settings/username'
      // Define a remote host dynamically
      remotes.create('dynamic1') {
        host = targetHost
        user = targetUser
      }
    }
  }
}

task something(dependsOn: setupRemote) << {
  ssh.run {
    session(remotes.dynamic1) {
      //execute ...
    }
  }
}
```


Perform operations
------------------

Following methods are available in a session closure.

* `execute` - Execute a command.
* `executeBackground` - Execute a command in background.
* `executeSudo` - Execute a command with sudo support.
* `shell` - Execute a shell.
* `put` - Put a file or directory into the remote host.
* `get` - Get a file or directory from the remote host.


### Execute a command

Call the `execute` method with a command to execute.

```groovy
execute 'sudo service httpd reload'
```

The method can be called with operation settings.

```groovy
execute 'sudo service httpd reload', pty: true
```

The method waits until the command is completed and returns a result from standard output of the command.
Line separators are converted to the platform native.

```groovy
def result = execute 'uname -a'
println result
```

A result can be retrieved as an argument if a closure is given.

```groovy
execute('uname -a') { result ->
  println result
}
```

The method throws an exception if an exit status of the command was not zero. It can be ignored if the `ignoreError` setting is given as follow:

```groovy
execute 'exit 1', ignoreError: true
```


### Execute a command in background

Call the `executeBackground` method with a command to execute in background.

```groovy
executeBackground 'sudo service httpd reload'

// also can be called with operation settings
executeBackground 'sudo service httpd reload', pty: true
```

The method does not wait for the command.
Other commands are executed concurrently.

```groovy
// httpd processes on all web servers will be reloaded concurrently
session(remotes.role('webServers')) {
  executeBackground 'sudo service httpd reload'
}

// ping to many hosts concurrently
session(remotes.web01) {
  (1..127).each { lastOctet ->
    executeBackground "ping -c 1 -w 1 192.168.1.$lastOctet"
  }
}
```

A result can be retrieved as an argument if a closure is given.

```groovy
executeBackground('ping -c 3 server') { result ->
  def average = result.find('min/avg/.+=.+?/.+?/').split('/')[-1]
}
```

The method throws an exception if an exit status of the command is not zero.
If a background command returned an error, `ssh.run` method waits for any other commands and throws an exception finally.

It ignores the exit status if the `ignoreError` setting is given as follow:

```groovy
executeBackground 'exit 1', ignoreError: true
```


### Execute a command with the sudo support

Call the `executeSudo` method with a command to execute with the sudo support.
The method prepends `sudo -S -p` to the command and will provide a password for sudo prompt.

```groovy
executeSudo 'service httpd reload'

// also can be called with operation settings
executeSudo 'service httpd reload', pty: true
```

The method waits until the command is completed and returns a result from standard output of the command, excluding sudo interactions.
Line separators are converted to the platform native.

```groovy
def result = executeSudo 'service httpd status'
println result
```

A result can be retrieved as an argument if a closure is given.

```groovy
executeSudo('service httpd status') { result ->
  println result
}
```

The method throws an exception if an exit status of the command was not zero, including the sudo authentication failure. Also the `ignoreError` setting is supported.

The sudo support is achieved by the stream interaction support. So the method does not accept an `interaction` setting.


### Execute a shell

Call the `shell` method to execute a shell.
The method is useful for a limited environment which supports only a shell such as Cisco IOS.

A stream interaction setting should be given in order to exit the shell.

```groovy
session(remotes.web01) {
  shell interaction: {
    when(partial: ~/.*$/) {
      standardInput << 'exit 0' << '\n'
    }
  }
}
```

The method throws an exception if an exit status of the shell was not zero. It can be ignored if the `ignoreError` setting is given as follow:

```groovy
shell ignoreError: true, interaction: {...}
```


### Transfer a file or directory

Call the `get` method to get a file or directory from the remote host.

```groovy
// specify the file path
get from: '/remote/file', into: 'local_file'

// specify a File object
get from: '/remote/file', into: buildDir

// specify an output stream
file.withOutputStream { stream ->
  get from: '/remote/file', into: stream
}

// get content as a string
def text = get from: '/remote/file'
```

Call the `put` method to put a file or directory into the remote host. It also accepts content such as a string or byte array.

```groovy
// specify the file path
put from: 'local_file', into: '/remote/file'

// specify a File object
put from: buildDir, into: '/remote/folder'

// specify an Iterable<File>
put from: files('local_file1', 'local_file2'), into: '/remote/folder'

// specify an input stream
file.withInputStream { stream ->
  put from: stream, into: '/remote/file.txt'
}

// specify a string
put text: '''#!/bin/sh
echo 'hello world'
''', into: '/remote/script.sh'

// specify a byte array
put bytes: [0xff, 0xff], into: '/remote/fixture.dat'
```

The method throws an exception if an error occurred while the file transfer.


### Enable the port forwarding

Call the `forwardLocalPort` method to forward a local port to a remote port.

```groovy
// Forward localhost:18080 to remote:8080
forwardLocalPort port: 18080, hostPort: 8080

// Forward localhost:(allocated port) to remote:8080
int port = forwardLocalPort hostPort: 8080

// Forward localhost:18080 to 172.16.1.1:8080
forwardLocalPort port: 18080, host: '172.16.1.1', hostPort: 8080

// Forward *:18080 (listen to all) to 172.16.1.1:8080
forwardLocalPort bind: '0.0.0.0', port: 18080, host: '172.16.1.1', hostPort: 8080
```

The method accepts following settings:

Key              | Type               | Description
-----------------|--------------------|------------
port             | Integer            | Local port to bind. Defaults to 0, automatically allocated a free port.
bind             | String             | Local address to bind. Defaults to `localhost`.
hostPort         | Integer, Mandatory | Remote port to connect.
host             | String             | Remote address to connect. Default to `localhost` of the remote host.


Call the `forwardRemotePort` method to forward a local port to a remote port.

```groovy
// Forward remote:30000 to localhost:8080
forwardRemotePort port: 30000, hostPort: 8080

// Forward remote:30000 to 192.168.1.5:8080
forwardRemotePort port: 30000, host: '192.168.1.5', hostPort: 8080

// Forward remote:30000 (listen to all) to 192.168.1.5:8080
forwardRemotePort bind: '0.0.0.0', port: 30000, host: '192.168.1.5', hostPort: 8080
```

The method accepts following settings:

Key              | Type               | Description
-----------------|--------------------|------------
port             | Integer, Mandatory | Remote port to bind.
bind             | String             | Remote address to bind. Defaults to `localhost` of the remote host.
hostPort         | Integer, Mandatory | Local port to connect.
host             | String             | Local address to connect. Default to `localhost`.

The port forwarding is valid until all sessions are finished.
So we can connect to a server via a tunnel in the `ssh.run` method.

```groovy
import groovyx.net.http.RESTClient

ssh.run {
  session(remotes.web01) {
    forwardLocalPort port: 8080, hostPort: 8080

    // access to the HTTP server via the tunnel
    new RESTClient('http://localhost:8080').get(path: '/')
  }
}
```


### Operation settings

Following settings can be given to operation methods.

Key              | Type     | Description
-----------------|----------|------------
`dryRun`         | Boolean  | Dry run flag. If this is true, no action is performed. Defaults to false.
`pty`            | Boolean  | If this is true, the PTY allocation is requested on the command execution. Defaults to false.
`ignoreError`    | Boolean  | If set to true, an exit status of the command or shell is ignored. Defaults to false.
`logging`        | String   | If this is `slf4j`, console log of the remote command is sent to Gradle logger. If this is `stdout`, it is sent to standard output/error. If this is `none`, console logging is turned off. Defaults to `slf4j`.
`outputStream`   | OutputStream | If given, standard output of the remote command is sent to the stream.
`errorStream`    | OutputStream | If given, standard error of the remote command is sent to the stream.
`encoding`       | String   | Encoding of input and output on the command or shell execution. Defaults to `UTF-8`.
`interaction`    | Closure  | Specifies an interaction with the stream on the command or shell execution. Defaults to no interaction.
`extensions`     | List     | List of extension trait or map. If a trait is given, it is applied to the session closure. It a map is given, key and value must be a method name and an implementation closure, all keys are added as methods in the session closure. Defaults to an empty.


### The stream interaction support

The execute method can interact with the stream of command executed on the remote host.
The shell method can do same.
This feature is useful for providing a password or yes/no answer.


#### Declare interaction rules

Call the execute or shell method with an `interaction` setting which contains one or more interaction rules.
Interaction rules will be evaluated in order.
If any rule has been matched, others are not evaluated more.

The following example declares 2 rules.

```groovy
interaction: {
  // Declare a rule
  when(/* a pattern match */) {
    /* an action closure */
  }

  // Below rule will be evaluated only if above is not matched
  when(/* a pattern match */) {
    /* an action closure */
  }
}
```


#### An interaction rule is

An interaction rule consists of a pattern match and an action closure.
The action closure will be executed if the pattern match is satisfied.

A pattern match is one of the following.

* `when(partial: pattern, from: stream)`
  Declares if a partial string from the stream is matched to the pattern.
* `when(line: pattern, from: stream)`
  Declares if a line from the stream is matched to the pattern.
* `when(nextLine: pattern, from: stream)`
  Declares if an next line from the stream is matched to the pattern.

`partial` is evaluated when the stream is flushed.
But `line` and `nextLine` is evaluated when the stream gives a line separator.

The pattern is one of the following.

* If the pattern is a string, it performs exact match.
* If the pattern is a regular expression, it performs regular expression match. Groovy provides pretty notation such as `~/pattern/`.
* If the pattern is `_`, it matches to any line even if empty.

The stream is one of the following.

* `standardOutput` - Standard output of the command.
* `standardError` - Standard error of the command.
* If the stream is omitted, it means any.

Now explaining another one of an interaction rule, an action closure.

An action closure is a generic Groovy closure executed if the pattern match is satisfied.
It can write a string to the `standardInput`.

```groovy
interaction: {
  when(partial: ~/.*#/) {
    standardInput << 'exit' << '\n'
  }
}
```

If an action closure contains one or more interaction rules, surrounding rules are discarded and inner rules are activated.
In the following case, at first, A and B are evaluated for an each line or partial string,
but C is evaluated after A has been matched.

```groovy
interaction: {
  when(/* rule A */) {
    when(/* rule C */) {
    }
  }
  when(/* rule B */) {
  }
}
```


#### Example: handle the prompt

Let's take a look at the following example.

```groovy
// Execute a shell with the interaction support
shell interaction: {
  // Declare a rule if the stream gives a string terminated with $
  when(partial: ~/.*$/) {
    // If the rule is matched, provides the exit to the shell
    standardInput << 'exit 0' << '\n'
  }
}
```

The example will execute a shell and provide the exit if the prompt appears.

If the shell prompt is `sh$`, pattern matching will work as follows.

1. The stream gives `s` and the line buffer becomes `s`.
2. The pattern match is evaluated but not matched.
3. The stream gives `h` and the line buffer becomes `sh`.
4. The pattern match is evaluated but not matched.
5. The stream gives `$` and the line buffer becomes `sh$`..
6. The pattern match is evaluated and matched. The closure is executed.


#### Example: handle more prompts

TODO

```groovy
execute('passwd', pty: true, interaction: {
  when(partial: ~/.+[Pp]assowrd: */) {
    standardInput << oldPassword << '\n'
    when(partial: ~/.+[Pp]assowrd: */) {
      standardInput << newPassword << '\n'
    }
  }
})
```


Override settings
-----------------

Connection settings and operation settings can be set globally
and overridden by each remote hosts, methods or operation methods.


Category            | Global | Per method | Per remote | Per operation
--------------------|--------|------------|------------|--------------
Connection settings | x      | x          | x          | -
Operation settings  | x      | x          | -          | x


Connection settings and operation settings can be set globally as follows.

```groovy
ssh.settings {
  knownHosts = allowAnyHosts
  dryRun = true
}
```

Connection settings and operation settings can be overridden as follows.

```groovy
task reloadServers << {
  ssh.run {
    settings {
      // overrides global settings
      pty = true
    }
    session(remotes.role('webServers')) {
      executeBackground('sudo service httpd reload')
    }
  }
}
```

Connection settings can be overridden in a remote host closure.

```groovy
remotes {
  web01 {
    host = '192.168.1.101'
    user = 'jenkins'
    identity = file('id_rsa_jenkins')
  }
}
```

Operation settings can be overridden on an operation method.

```groovy
execute('sudo service httpd reload', pty: false)
execute('sudo service httpd reload', logging: false)
```


DSL extension system
--------------------

We can extend DSL vocabulary using the extension system.
This feature is still experimental and may be improved in the future.

### Start from a simple extension

Add a map to `extension` of the operation settings.
Following example adds the method `restartAppServer` and it is available in the session closure.

```groovy
ssh.settings {
  extensions.add restartAppServer: {
    execute 'sudo service tomcat restart'
  }
}

ssh.run {
  session(ssh.remotes.testServer) {
    restartAppServer()
  }
}
```

### Use Gradle feature in an extension

We can use project properties such as configurations and dependencies from the extension.
Following example transfers the `groovy-all` jar and execute a script on the remote host.

```groovy
repositories {
  jcenter()
}

configurations {
  groovyRuntime
}

dependencies {
  groovyRuntime 'org.codehaus.groovy:groovy-all:2.3.9'
}

ssh.settings {
  /**
   * Execute a Groovy script on the remote host.
   * Groovy dependency must be set as the configuration groovyRuntime.
   */
  extensions.add executeGroovyScript: { String script ->
    def temporaryPath = "/tmp/${UUID.randomUUID()}"
    try {
      execute "mkdir -vp $temporaryPath"
      put from: project.configurations.groovyRuntime, into: temporaryPath
      put text: script, into: "$temporaryPath/script.groovy"
      execute "java -jar $temporaryPath/groovy-all-*.jar $temporaryPath/script.groovy"
    } finally {
      execute "rm -vfr $temporaryPath"
    }
  }
}

task example << {
  ssh.run {
    session(remotes.webServer) {
      // Execute a script on the remote host
      executeGroovyScript 'println GroovySystem.version'
    }
  }
}
```

### Alternative: Trait based extension

Create an extension trait in the `buildSrc/src/main/groovy` directory.

```groovy
// buildSrc/src/main/groovy/extensions.groovy
trait RemoteFileExtension {
  void eachFile(String directory, Closure closure) {
    sftp {
      ls(directory).each(closure)
    }
  }
}
```

Properties and methods in the trait are available in the session closure.

```groovy
// build.gradle
ssh.run {
  settings {
    extensions.add RemoteFileExtension
  }
  session(remotes.localhost) {
    eachFile('/webapps') {
      println it.filename
    }
  }
}
```

An extension trait must be placed in the `buildSrc/src/main/groovy` directory.
