export default function (rawLogs) {
  for (let i = 0; i < rawLogs.length; i++) {
    console.log(rawLogs[i].event)

    if (rawLogs[i].event.indexOf('Debug') > -1) {
      console.log(rawLogs[i].args.value.toString())
    }
  }
}
