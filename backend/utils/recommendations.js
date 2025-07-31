async function getRecommendations(user, books) {
  // Recommend books from user's preferred genres not already read/favorited
  const readIds = new Set((user.readingHistory || []).map(r => r.bookId));
  const favoriteIds = new Set(user.favorites || []);
  const preferredGenres = user.preferences || [];
  return books.filter(
    book =>
      preferredGenres.includes(book.genre) &&
      !readIds.has(book.id) &&
      !favoriteIds.has(book.id)
  ).slice(0, 10);
}

module.exports = { getRecommendations };
