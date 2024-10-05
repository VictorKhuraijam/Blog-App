export  function timeAgo(dateString) {
  const now = new Date();
  const postDate = new Date(dateString);
  const secondsAgo = Math.floor((now - postDate) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [key, secondsInInterval] of Object.entries(intervals)) {
    const intervalCount = Math.floor(secondsAgo / secondsInInterval);
    if (intervalCount >= 1) {
      return `${intervalCount} ${key}${intervalCount !== 1 ? 's' : ''} ago`;
    }
  }

  return "just now";
}
