const generateMessage = (text, username) => {
  return {
    text,
    username: username || 'System',
    createdAt: new Date().getTime(),
  };
};

module.exports = {
  generateMessage,
};
