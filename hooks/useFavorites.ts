import { useState, useEffect } from 'react';
import { Perumahan } from '@/components/HouseCard';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Perumahan[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sikumbang_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
  }, []);

  const toggleFavorite = (house: Perumahan) => {
    setFavorites(prev => {
      const isExist = prev.some(f => f.idLokasi === house.idLokasi);
      let newFavs;
      if (isExist) {
        newFavs = prev.filter(f => f.idLokasi !== house.idLokasi);
      } else {
        newFavs = [...prev, house];
      }
      localStorage.setItem('sikumbang_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const isFavorite = (idLokasi: string) => {
    return favorites.some(f => f.idLokasi === idLokasi);
  };

  const addMultipleFavorites = (houses: Perumahan[]) => {
    setFavorites(prev => {
      const newFavs = [...prev];
      houses.forEach(house => {
        if (!newFavs.some(f => f.idLokasi === house.idLokasi)) {
          newFavs.push(house);
        }
      });
      localStorage.setItem('sikumbang_favorites', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  return { favorites, toggleFavorite, isFavorite, addMultipleFavorites };
}
