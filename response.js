const response = (statusocde, data, message, res) => {
    res.json({
        payload: {data, message}
    })
}

module.exports = response
