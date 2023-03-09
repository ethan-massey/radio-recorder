function getFormattedCurrentDate() {
    var d = new Date()

    let metrics = {
        month: '' + (d.getMonth() + 1),
        day: '' + d.getDate(),
        year: '' + d.getFullYear(),
        hour: '' + d.getHours(),
        minute: '' + d.getMinutes(),
        second: '' + d.getSeconds()
    }

    Object.getOwnPropertyNames(metrics).forEach((prop) => {
        if (metrics[`${prop}`].length < 2){
            metrics[`${prop}`] = '0' + metrics[`${prop}`]
        }
    })

    return [metrics.year, metrics.month, metrics.day].join('-') + 'T' + [metrics.hour, metrics.minute, metrics.second].join('-')
}

module.exports = {
    getFormattedCurrentDate
}
