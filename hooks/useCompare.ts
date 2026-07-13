import { useState, useEffect } from 'react';
import { Perumahan } from '@/components/HouseCard';

export function useCompare() {
  const [compareList, setCompareList] = useState<Perumahan[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sikumbang_compare');
      if (saved) {
        setCompareList(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load compare list', e);
    }
  }, []);

  const toggleCompare = (house: Perumahan) => {
    let message = '';
    setCompareList(prev => {
      const isExist = prev.some(f => f.idLokasi === house.idLokasi);
      let newCompare;
      if (isExist) {
        newCompare = prev.filter(f => f.idLokasi !== house.idLokasi);
      } else {
        if (prev.length >= 3) {
          message = 'Maksimal 3 perumahan yang dapat dibandingkan.';
          return prev;
        }
        newCompare = [...prev, house];
      }
      localStorage.setItem('sikumbang_compare', JSON.stringify(newCompare));
      return newCompare;
    });
    if (message) {
      alert(message);
    }
  };

  const isCompared = (idLokasi: string) => {
    return compareList.some(f => f.idLokasi === idLokasi);
  };

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem('sikumbang_compare');
  };

  return { compareList, toggleCompare, isCompared, clearCompare };
}
