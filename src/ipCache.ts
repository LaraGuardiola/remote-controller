const STORAGE_KEY = "remote_control_favorite_ips";
const MAX_FAVORITES = 10;

interface FavoriteIP {
  ip: string;
  lastUsed: number;
  successCount: number;
}

export const getFavoriteIPs = (): FavoriteIP[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const favorites: FavoriteIP[] = JSON.parse(stored);

    // Ordered by last used (most recent first)
    return favorites.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch (error) {
    console.error("Error reading favorite IPs:", error);
    return [];
  }
};

export const saveFavoriteIP = (ip: string): void => {
  try {
    const favorites = getFavoriteIPs();
    const existingIndex = favorites.findIndex((fav) => fav.ip === ip);

    if (existingIndex !== -1) {
      favorites[existingIndex].lastUsed = Date.now();
      favorites[existingIndex].successCount++;
    } else {
      const newFavorite: FavoriteIP = {
        ip,
        lastUsed: Date.now(),
        successCount: 1,
      };

      favorites.unshift(newFavorite);

      if (favorites.length > MAX_FAVORITES) {
        favorites.length = MAX_FAVORITES;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    console.log(`✅ IP ${ip} saved to favorites`);
  } catch (error) {
    console.error("Error saving favorite IP:", error);
  }
};

export const removeFavoriteIP = (ip: string): void => {
  try {
    const favorites = getFavoriteIPs();
    const filtered = favorites.filter((fav) => fav.ip !== ip);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`🗑️ IP ${ip} removed from favorites`);
  } catch (error) {
    console.error("Error removing favorite IP:", error);
  }
};

export const clearFavoriteIPs = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("🗑️ All favorite IPs cleared");
  } catch (error) {
    console.error("Error clearing favorite IPs:", error);
  }
};

export const getFavoriteIPsList = (): string[] => {
  return getFavoriteIPs().map((fav) => fav.ip);
};
