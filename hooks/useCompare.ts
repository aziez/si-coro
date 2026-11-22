import { useState, useEffect } from "react"
import { Perumahan } from "@/components/HouseCard"

export function useCompare(onNotify?: (msg: string) => void) {
  const [compareList, setCompareList] = useState<Perumahan[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sikumbang_compare")
      if (saved) {
        setCompareList(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load compare list", e)
    }
  }, [])

  const toggleCompare = (house: Perumahan) => {
    let feedbackMsg = ""
    setCompareList((prev) => {
      const isExist = prev.some((f) => f.idLokasi === house.idLokasi)
      let newCompare
      if (isExist) {
        newCompare = prev.filter((f) => f.idLokasi !== house.idLokasi)
        feedbackMsg = `${house.namaPerumahan} dihapus dari perbandingan.`
      } else {
        if (prev.length >= 3) {
          feedbackMsg = "Maksimal 3 perumahan yang dapat dibandingkan sekaligus."
          return prev
        }
        newCompare = [...prev, house]
        feedbackMsg = `${house.namaPerumahan} ditambahkan ke perbandingan (${newCompare.length}/3).`
      }
      localStorage.setItem("sikumbang_compare", JSON.stringify(newCompare))
      return newCompare
    })
    if (feedbackMsg && onNotify) {
      onNotify(feedbackMsg)
    }
  }

  const isCompared = (idLokasi: string) => {
    return compareList.some((f) => f.idLokasi === idLokasi)
  }

  const clearCompare = () => {
    setCompareList([])
    localStorage.removeItem("sikumbang_compare")
    onNotify?.("Daftar perbandingan dikosongkan.")
  }

  return { compareList, toggleCompare, isCompared, clearCompare }
}
