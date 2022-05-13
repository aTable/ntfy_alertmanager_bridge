# ntfy alertmanager bridge

A basic alertmanager bridge to ntfy. Currently, you can pass a `jq` selector for the following fields:

- ntfy topic
- ntfy title
- ntfy priority
- // TODO: ntfy message

in the alertmanager webhook config:

```sh
...
receivers:
  - name: "ntfy-servers"
    webhook_configs:
      - url: http://ntfy_alertmanager_bridge:30000/ntfy_alert?topic=.labels.topic&title=.annotations.summary&priority=.labels.priority|tonumber
        send_resolved: true
        max_alerts: 0
...
```

which will result in a notification like so:

![example of notification](documentation/example-notification.png "Example notification")

## Development

```sh
docker-compose up
```

Navigate to `http://localhost:30001/ntfy_alertmanager_bridge_topic`
