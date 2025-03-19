"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface PrayerTime {
  name: string
  time: string
  nameIndo: string
}

interface Location {
  latitude: number
  longitude: number
  city: string
}

export default function Home() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
  const [imsakiyahSchedule, setImsakiyahSchedule] = useState<any[]>([])
  const [location, setLocation] = useState<Location | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Mendapatkan lokasi pengguna
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords

          try {
            // Mendapatkan nama kota berdasarkan koordinat
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`,
            )
            const data = await response.json()

            setLocation({
              latitude,
              longitude,
              city: data.city || data.locality || "Lokasi Anda",
            })
          } catch (error) {
            setLocation({
              latitude,
              longitude,
              city: "Lokasi Anda",
            })
          }
        },
        (error) => {
          console.error("Error getting location:", error)
          toast({
            title: "Gagal mendapatkan lokasi",
            description: "Menggunakan lokasi default (Jakarta)",
            variant: "destructive",
          })

          // Default ke Jakarta jika lokasi tidak tersedia
          setLocation({
            latitude: -6.2088,
            longitude: 106.8456,
            city: "Jakarta",
          })
        },
      )
    } else {
      toast({
        title: "Geolokasi tidak didukung",
        description: "Browser Anda tidak mendukung geolokasi",
        variant: "destructive",
      })

      // Default ke Jakarta jika geolokasi tidak didukung
      setLocation({
        latitude: -6.2088,
        longitude: 106.8456,
        city: "Jakarta",
      })
    }
  }, [toast])

  // Mendapatkan waktu sholat berdasarkan lokasi
  useEffect(() => {
    if (location) {
      setIsLoading(true)
      const fetchPrayerTimes = async () => {
        try {
          const date = new Date()
          const year = date.getFullYear()
          const month = date.getMonth() + 1
          const day = date.getDate()

          const response = await fetch(
            `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${location.latitude}&longitude=${location.longitude}&method=11`,
          )

          const data = await response.json()
          const timings = data.data.timings

          const prayerTimesData: PrayerTime[] = [
            { name: "Fajr", time: timings.Fajr, nameIndo: "Subuh" },
            { name: "Sunrise", time: timings.Sunrise, nameIndo: "Terbit" },
            { name: "Dhuhr", time: timings.Dhuhr, nameIndo: "Dzuhur" },
            { name: "Asr", time: timings.Asr, nameIndo: "Ashar" },
            { name: "Maghrib", time: timings.Maghrib, nameIndo: "Maghrib" },
            { name: "Isha", time: timings.Isha, nameIndo: "Isya" },
          ]

          setPrayerTimes(prayerTimesData)
          setIsLoading(false)
        } catch (error) {
          console.error("Error fetching prayer times:", error)
          toast({
            title: "Gagal mendapatkan jadwal sholat",
            description: "Terjadi kesalahan saat mengambil data jadwal sholat",
            variant: "destructive",
          })
          setIsLoading(false)
        }
      }

      const fetchImsakiyahSchedule = async () => {
        try {
          // Mendapatkan jadwal imsakiyah untuk bulan Ramadhan
          // Catatan: Ini adalah contoh data, dalam implementasi nyata Anda perlu menggunakan API yang sesuai
          const date = new Date()
          const year = date.getFullYear()
          const month = 3 // Asumsi bulan Ramadhan (akan berbeda setiap tahun)

          const response = await fetch(
            `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${location.latitude}&longitude=${location.longitude}&method=11`,
          )

          const data = await response.json()
          const days = data.data

          // Membuat jadwal imsakiyah untuk 30 hari
          const imsakiyahData = days.map((day: any) => {
            return {
              date: day.date.readable,
              imsak: day.timings.Imsak,
              fajr: day.timings.Fajr,
              maghrib: day.timings.Maghrib,
            }
          })

          setImsakiyahSchedule(imsakiyahData)
        } catch (error) {
          console.error("Error fetching imsakiyah schedule:", error)
          toast({
            title: "Gagal mendapatkan jadwal imsakiyah",
            description: "Terjadi kesalahan saat mengambil data jadwal imsakiyah",
            variant: "destructive",
          })
        }
      }

      fetchPrayerTimes()
      fetchImsakiyahSchedule()

      // Update waktu saat ini setiap menit
      const interval = setInterval(() => {
        setCurrentDate(new Date())
      }, 60000)

      return () => clearInterval(interval)
    }
  }, [location, toast])

  // Mengaktifkan notifikasi
  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notifikasi tidak didukung",
        description: "Browser Anda tidak mendukung notifikasi",
        variant: "destructive",
      })
      return
    }

    if (Notification.permission === "granted") {
      setNotificationsEnabled(true)
      toast({
        title: "Notifikasi diaktifkan",
        description: "Anda akan menerima notifikasi adzan",
      })
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission()

      if (permission === "granted") {
        setNotificationsEnabled(true)
        toast({
          title: "Notifikasi diaktifkan",
          description: "Anda akan menerima notifikasi adzan",
        })
      } else {
        toast({
          title: "Izin notifikasi ditolak",
          description: "Anda tidak akan menerima notifikasi adzan",
          variant: "destructive",
        })
      }
    }
  }

  // Memeriksa waktu sholat untuk notifikasi
  useEffect(() => {
    if (notificationsEnabled && prayerTimes.length > 0) {
      const checkPrayerTimes = () => {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()

        prayerTimes.forEach((prayer) => {
          if (prayer.name === "Sunrise") return // Skip notifikasi untuk waktu matahari terbit

          const [hour, minute] = prayer.time.split(":").map(Number)

          if (currentHour === hour && currentMinute === minute) {
            new Notification(`Waktu ${prayer.nameIndo}`, {
              body: `Sekarang waktu ${prayer.nameIndo} untuk wilayah ${location?.city}`,
              icon: "/placeholder.svg?height=64&width=64",
            })
          }
        })
      }

      const interval = setInterval(checkPrayerTimes, 60000) // Periksa setiap menit
      return () => clearInterval(interval)
    }
  }, [notificationsEnabled, prayerTimes, location])

  // Format waktu
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  // Mendapatkan waktu sholat berikutnya
  const getNextPrayer = () => {
    if (prayerTimes.length === 0) return null

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    for (const prayer of prayerTimes) {
      if (prayer.name === "Sunrise") continue // Skip matahari terbit

      const [hour, minute] = prayer.time.split(":").map(Number)

      if (hour > currentHour || (hour === currentHour && minute > currentMinute)) {
        return prayer
      }
    }

    // Jika semua waktu sholat hari ini telah lewat, kembalikan waktu sholat pertama (Subuh)
    return prayerTimes[0]
  }

  // Add this function to get today's Imsakiyah time
  // Add it after the getNextPrayer function and before the formatDateIndo function

  // Mendapatkan waktu imsakiyah hari ini
  const getTodayImsakiyah = () => {
    if (imsakiyahSchedule.length === 0) return "00:00"

    const today = new Date()
    const todayStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" })

    // Cari jadwal imsakiyah untuk hari ini
    const todaySchedule = imsakiyahSchedule.find((day) => {
      // Format tanggal dari API: "Mar 12, 2024"
      return day.date.includes(todayStr)
    })

    // Jika tidak ditemukan, gunakan jadwal hari pertama
    return todaySchedule ? todaySchedule.imsak : imsakiyahSchedule[0].imsak
  }

  // Format tanggal Indonesia
  const formatDateIndo = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    return date.toLocaleDateString("id-ID", options)
  }

  const nextPrayer = getNextPrayer()

  const getTodayImsakiyahOld = () => {
    const today = new Date().toLocaleDateString("en-CA")
    const todayImsakiyah = imsakiyahSchedule.find((item) => item.date.startsWith(today))
    return todayImsakiyah ? todayImsakiyah.imsak : "Memuat..."
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-800 to-green-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Jadwal Imsakiyah & Adzan</h1>
          <p className="text-lg opacity-90">{formatDateIndo(currentDate)}</p>

          {location && (
            <div className="flex items-center justify-center mt-2 text-green-200">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{location.city}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Kartu waktu sholat berikutnya */}
          <Card className="bg-green-700/30 border-green-600 backdrop-blur-sm text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-center">Waktu Sholat Berikutnya</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {isLoading ? (
                <div className="animate-pulse h-20 bg-green-600/20 rounded-md"></div>
              ) : nextPrayer ? (
                <>
                  <h2 className="text-4xl font-bold mb-2">{nextPrayer.nameIndo}</h2>
                  <p className="text-3xl">{formatTime(nextPrayer.time)}</p>
                </>
              ) : (
                <p>Memuat data...</p>
              )}

              <Button
                variant="outline"
                className="mt-4 w-full bg-green-600/30 border-green-500 hover:bg-green-600/50 text-white"
                onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : enableNotifications}
              >
                {notificationsEnabled ? (
                  <>
                    <BellOff className="mr-2 h-4 w-4" />
                    <span className="sm:inline">Matikan</span>
                    <span className="hidden sm:inline"> Notifikasi</span>
                  </>
                ) : (
                  <>
                    <Bell className="mr-2 h-4 w-4" />
                    <span className="sm:inline">Aktifkan</span>
                    <span className="hidden sm:inline"> Notifikasi</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Kartu waktu Imsakiyah hari ini */}
          <Card className="bg-green-700/30 border-green-600 backdrop-blur-sm text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-center">Waktu Imsakiyah Hari Ini</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {isLoading || imsakiyahSchedule.length === 0 ? (
                <div className="animate-pulse h-20 bg-green-600/20 rounded-md"></div>
              ) : (
                <>
                  <h2 className="text-4xl font-bold mb-2">Imsak</h2>
                  <p className="text-3xl">{formatTime(getTodayImsakiyah())}</p>
                  <p className="mt-4 text-sm text-green-200">Waktu berhenti makan sahur</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Kartu jadwal sholat hari ini */}
          <Card className="md:col-span-2 bg-green-700/30 border-green-600 backdrop-blur-sm text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-center">Jadwal Sholat Hari Ini</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-12 bg-green-600/20 rounded-md"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {prayerTimes.map(
                    (prayer) =>
                      prayer.name !== "Sunrise" && (
                        <div key={prayer.name} className="bg-green-600/20 rounded-lg p-3 text-center">
                          <h3 className="font-medium text-green-200">{prayer.nameIndo}</h3>
                          <p className="text-xl font-bold">{formatTime(prayer.time)}</p>
                        </div>
                      ),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Jadwal Imsakiyah */}
        <div className="mt-8">
          <Tabs defaultValue="imsakiyah" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-green-700/30 text-white">
              <TabsTrigger value="imsakiyah" className="data-[state=active]:bg-green-600">
                Jadwal Imsakiyah
              </TabsTrigger>
              <TabsTrigger value="monthly" className="data-[state=active]:bg-green-600">
                Jadwal Bulanan
              </TabsTrigger>
            </TabsList>
            <TabsContent value="imsakiyah">
              <Card className="bg-green-700/30 border-green-600 backdrop-blur-sm text-white">
                <CardHeader>
                  <CardTitle className="text-center">Jadwal Imsakiyah Ramadhan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-green-600/40">
                          <th className="p-2 text-left">Tanggal</th>
                          <th className="p-2 text-center">Imsak</th>
                          <th className="p-2 text-center">Subuh</th>
                          <th className="p-2 text-center">Berbuka</th>
                        </tr>
                      </thead>
                      <tbody>
                        {imsakiyahSchedule.length > 0 ? (
                          imsakiyahSchedule.map((day, index) => (
                            <tr key={index} className="border-b border-green-600/30">
                              <td className="p-2">{day.date}</td>
                              <td className="p-2 text-center">{formatTime(day.imsak)}</td>
                              <td className="p-2 text-center">{formatTime(day.fajr)}</td>
                              <td className="p-2 text-center">{formatTime(day.maghrib)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center">
                              Memuat jadwal imsakiyah...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="monthly">
              <Card className="bg-green-700/30 border-green-600 backdrop-blur-sm text-white">
                <CardHeader>
                  <CardTitle className="text-center">Jadwal Sholat Bulanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-green-600/40">
                          <th className="p-2 text-left">Tanggal</th>
                          <th className="p-2 text-center">Subuh</th>
                          <th className="p-2 text-center">Dzuhur</th>
                          <th className="p-2 text-center">Ashar</th>
                          <th className="p-2 text-center">Maghrib</th>
                          <th className="p-2 text-center">Isya</th>
                        </tr>
                      </thead>
                      <tbody>
                        {imsakiyahSchedule.length > 0 ? (
                          imsakiyahSchedule.map((day, index) => (
                            <tr key={index} className="border-b border-green-600/30">
                              <td className="p-2">{day.date}</td>
                              <td className="p-2 text-center">{formatTime(day.fajr)}</td>
                              <td className="p-2 text-center">12:00</td>
                              <td className="p-2 text-center">15:00</td>
                              <td className="p-2 text-center">{formatTime(day.maghrib)}</td>
                              <td className="p-2 text-center">19:30</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-4 text-center">
                              Memuat jadwal bulanan...
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-green-200 opacity-80">
          <p>© {new Date().getFullYear()} Jadwal Imsakiyah & Adzan Online</p>
          <p className="mt-1">Dibuat dengan ❤️ untuk Ramadhan</p>
        </footer>
      </div>
    </main>
  )
}

