import { createFileRoute } from '@tanstack/react-router'
import useWebSocket, { ReadyState } from 'react-use-websocket'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircleQuestionIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import useSound from 'use-sound'
import FuzzyText from '@/components/FuzzyText/FuzzyText'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import hit1Sound from '@/audio/hit-1.wav'
import heal1Sound from '@/audio/heal-1.wav'
import startSound from '@/audio/start.mp3'

export const Route = createFileRoute('/')({
  component: Game,
})

const rows: Array<{
  name: string
  color: string
  borderColor: string
}> = [
  {
    name: 'A',
    color: '#10966e30',
    borderColor: '#10b27d',
  },
  {
    name: 'B',
    color: '#96841030',
    borderColor: '#968410',
  },
  {
    name: 'C',
    color: '#96381030',
    borderColor: '#963810',
  },
  {
    name: 'D',
    color: '#5a109630',
    borderColor: '#5a1096',
  },
]

const socketUrl = import.meta.env.VITE_API_BASE_URL + '/games/ws'

interface TeamData {
  name: string
  health: number
  maxHealth: number
  active: boolean
}

function Game() {
  const [isGameStarted, setIsGameStarted] = useState(false)

  const [myTeam, setMyTeam] = useState<string | null>(null)
  const cps = useRef<number>(0)
  // Feedback effect state: { [teamName]: 'heal' | 'attack' | null }
  const [feedback, setFeedback] = useState<
    Array<{
      particleId: string
      effect: 'heal' | 'attack'
      team: string
      x: number
      y: number
    }>
  >([])

  const [enableAudio] = useState(true)

  const [playHit1] = useSound(hit1Sound)
  const [playHeal1] = useSound(heal1Sound)
  const [playStart] = useSound(startSound)

  const { sendMessage, readyState } = useWebSocket(socketUrl, {
    shouldReconnect: () => true,
    reconnectInterval: 1000,
    reconnectAttempts: 10,
    onOpen: () => {
      console.log('Connected to WebSocket')
    },
    onClose: () => {
      console.log('Disconnected from WebSocket')
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
    },

    onMessage: (event) => {
      const data = JSON.parse(event.data) as {
        action:
          | 'UPDATE_TEAMS'
          | 'UPDATE_GLOBAL_EVENT_COUNT'
          | 'UPDATE_GAME_STARTED'
        data: unknown
      }

      if (data.action === 'UPDATE_TEAMS') {
        setTeamsData(data.data as Array<TeamData>)
      }
      if (data.action === 'UPDATE_GLOBAL_EVENT_COUNT') {
        // setCps(data.data as number)
        cps.current = data.data as number
      }
      if (data.action === 'UPDATE_GAME_STARTED') {
        const isStarted = data.data as boolean
        if (!isGameStarted && isStarted) {
          playStart()
        }
        setIsGameStarted(isStarted)
      }
    },
  })

  const [teamsData, setTeamsData] = useState<Array<TeamData>>([])

  const isConnected = readyState === ReadyState.OPEN

  const handleAttack = (team: string) => {
    if (!isGameStarted) return
    if (!myTeam) return
    const isMyTeam = myTeam === team

    const myTeamData = teamsData.find((t) => t.name === myTeam)
    const teamData = teamsData.find((t) => t.name === team)

    if (!teamData || !myTeamData) return

    if (teamData.active === false || myTeamData.active === false) return

    const particleId = nanoid()
    const element = document.querySelector(`[data-team="${team}"]`)

    if (element) {
      const rect = element.getBoundingClientRect()
      const x = Math.random() * rect.width * 2 - rect.width
      const y = Math.random() * rect.height * 2 - rect.height

      if (enableAudio) {
        if (isMyTeam) {
          playHeal1()
        } else {
          playHit1()
        }
      }

      setFeedback((prev) => [
        ...prev,
        { particleId, effect: isMyTeam ? 'heal' : 'attack', team, x, y },
      ])

      setTimeout(() => {
        setFeedback((prev) => prev.filter((f) => f.particleId !== particleId))
      }, 1000)
    }

    sendMessage(
      JSON.stringify({
        action: 'ATTACK',
        data: {
          myTeam: myTeam,
          team,
        },
      }),
    )
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const currentCps = cps.current

      // Create random effect
      for (let i = 0; i < currentCps; i++) {
        const particleId = nanoid()
        const effect = Math.random() < 0.2 ? 'heal' : 'attack'
        const team = rows[Math.floor(Math.random() * rows.length)].name

        const teamElement = document.querySelector(`[data-team="${team}"]`)
        if (teamElement) {
          const rect = teamElement.getBoundingClientRect()
          const x = Math.random() * rect.width * 2 - rect.width
          const y = Math.random() * rect.height * 2 - rect.height

          setTimeout(() => {
            setFeedback((prev) => [...prev, { particleId, effect, team, x, y }])

            setTimeout(() => {
              setFeedback((prev) =>
                prev.filter((f) => f.particleId !== particleId),
              )
            }, 1000)
          }, Math.random() * 1000)
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const isDefeated = useMemo(() => {
    if (myTeam) {
      const myTeamData = teamsData.find((t) => t.name === myTeam)
      return myTeamData?.active === false
    }
    return false
  }, [myTeam, teamsData])

  return (
    <>
      <div className="min-h-screen w-full relative">
        {/* Azure Depths */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(125% 125% at 50% 10%, #000000 40%, #010133 100%)',
          }}
        />

        {/* How to Play Drawer Button */}
        <div className="absolute top-4 right-4 z-10">
          <Drawer>
            <DrawerTrigger asChild>
              <Button className="px-4 py-2 rounded bg-white/90 text-black font-semibold shadow hover:bg-white">
                <MessageCircleQuestionIcon />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>วิธีเล่น</DrawerTitle>
                <ol className="list-decimal pl-5 space-y-2 text-left">
                  <li>เลือกทีมของคุณจากเมนูด้านบน</li>
                  <li>
                    คลิกที่แถวของทีมอื่นเพื่อโจมตี
                    หรือคลิกที่ทีมตัวเองเพื่อฟื้นฟูพลังชีวิต
                  </li>
                  <li>ดูจำนวนการโจมตี (CPS) ที่แสดงอยู่ด้านล่าง</li>
                  <li>ทีมที่พลังชีวิตหมดก่อนจะเป็นฝ่ายแพ้</li>
                </ol>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose asChild>
                  <button className="w-full px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800">
                    ปิด
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <main className="relative py-24">
          <div className="flex justify-center">
            {/* Responsive Hack? */}
            <div className="max-lg:hidden">
              <FuzzyText fontSize="clamp(1.5rem, 6vw, 6rem)">LAB WAR</FuzzyText>
            </div>
            <div className="lg:hidden">
              <FuzzyText fontSize="4rem">LAB WAR</FuzzyText>
            </div>
          </div>
          <div className="text-center text-2xl font-bold">
            สงคราม IOT LAB ได้เริ่มต้นขึ้นแล้ว!
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-xs font-normal">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Select
              value={myTeam ?? undefined}
              onValueChange={(value) => setMyTeam(value)}
              disabled={!isConnected}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="เลือกทีมของคุณ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">ทีม A</SelectItem>
                <SelectItem value="B">ทีม B</SelectItem>
                <SelectItem value="C">ทีม C</SelectItem>
                <SelectItem value="D">ทีม D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Class Room */}
          <div className="relative container mx-auto px-4 mt-16">
            <div className="grid grid-cols-4 gap-4 md:gap-16">
              {/* Front */}
              <div className="col-span-4 border border-white text-2xl font-bold py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  หน้าห้อง
                </div>
              </div>

              {/* แถว A */}
              {rows.map((row) => {
                const teamData = teamsData.find((t) => t.name === row.name)
                const teamEffects =
                  teamData?.active === true
                    ? feedback.filter((f) => f.team === row.name)
                    : []
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                const effects = Object.values(teamEffects || {})
                return (
                  <div
                    key={row.name}
                    className={cn(
                      'relative py-4 text-center cursor-pointer',
                      (!teamData?.active || !myTeam || isDefeated) &&
                        'cursor-not-allowed',
                    )}
                    onClick={() => handleAttack(row.name)}
                  >
                    <div
                      data-team={row.name}
                      className={cn(
                        'relative',
                        !teamData?.active && 'opacity-20',
                      )}
                    >
                      <div className="relative col-span-1 grid grid-cols-2 gap-1">
                        {Array.from({ length: 10 }).map((_, col) => (
                          <div
                            key={`${col}`}
                            data-row={row.name}
                            className="border text-2xl font-bold py-4 text-center h-16"
                            style={{
                              backgroundColor: row.color,
                              borderColor: row.borderColor,
                            }}
                          ></div>
                        ))}
                      </div>
                      {/* Feedback Effect Overlay */}
                      {effects.map((effect) => {
                        return (
                          <div
                            key={effect.particleId}
                            className="absolute z-10 inset-0 flex items-center justify-center pointer-events-none"
                            style={{
                              top: effect.y,
                              left: effect.x,
                            }}
                          >
                            <span
                              className={cn(
                                'animate-heal text-green-500 text-4xl font-extrabold drop-shadow-lg select-none',
                                effect.effect === 'heal' && 'animate-heal',
                                effect.effect === 'attack' && 'animate-attack',
                              )}
                            >
                              {effect.effect === 'heal' ? '+' : '💥'}
                            </span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="absolute inset-0 text-center h-full flex items-center justify-center">
                      <div className="select-none">
                        <div className="text-2xl font-bold">{row.name}</div>

                        {teamData?.active === true ? (
                          <div className="text-sm">
                            {teamData.health} / {teamData.maxHealth}
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-red-600">
                            Defeated
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {isGameStarted !== true && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-300/10 backdrop-blur-xs border border-neutral-300/20 rounded-xl">
                <div className="text-2xl font-bold">เกมยังไม่เริ่ม</div>
              </div>
            )}
          </div>

          {/* CPS Display */}
          <div className="flex items-center justify-center gap-2 mt-2 text-xs select-none">
            <span>จำนวนการโจมตี:</span>
            <span>{cps.current} ต่อวินาที</span>
          </div>
        </main>
      </div>
    </>
  )
}
