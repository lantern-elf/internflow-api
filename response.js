const response = (statusocde, data, message, res) => {
    res.json(statusocde, [
        {
            payload: {
                data,
                message
            }
        }
    ])
}

module.exports = response