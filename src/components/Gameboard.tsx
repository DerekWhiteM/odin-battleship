import Player from "../modules/Player"
import { isHit, isValidAttack } from "../modules/Gameboard"
import Game from "../modules/Game"
import { useDrop } from 'react-dnd'
import Ship from "../modules/Ship"
import { useState } from "react"
import ShipComponent from "./Ship"

export default function Gameboard (props: { player: Player, game: Game }) {
    const { player, game } = props

    const [ships, setShips] = useState<Array<Ship>>([])
    const [placingMode, setPlacingMode] = useState('horizontal')
    const title = player.isHuman ? "Your board" : "Enemy's board"

    return (
        <div className="gameboard">
            <h2>{title}</h2>
            <div className="gameboard__grid">
                <Tiles />
            </div>
            {player.isHuman && 
                <div className="gameboard__controls">
                    <button className="gameboard__controls__reset" onClick={() => {
                        player.gameboard.placedShips = []
                        setShips(player.gameboard.placedShips)
                    }}>Reset</button>
                    <ShipComponent id={'1'} length={2} placingMode={placingMode} setPlacingMode={setPlacingMode}/>
                </div>
            }
        </div>
    )

    function Tiles () {
        let elements = []
        let count = 0
        for (let i = 0; i < 10; i++) {
            for (let j =0; j < 10; j++) {
                const placedShip = player.gameboard.placedShips.find(placedShip => isHit(placedShip, { x: j, y: i }))
                const orientation = placedShip?.location?.start.y === placedShip?.location?.end.y
                    ? 'horizontal'
                    : 'vertical'
                const indexOfShip = () => {
                    if (!placedShip?.location) return null
                    if (orientation === 'horizontal') {
                        return j - placedShip.location.start.x
                    } else {
                        return i - placedShip.location.start.y
                    }
                }
                const className = () => {
                    if (!placedShip) return 'gameboard__grid__item'
                    if (orientation === 'horizontal') {
                        if (indexOfShip() === 0) return 'gameboard__grid__item--ship-h-first'
                        if (indexOfShip() === placedShip.length - 1) return 'gameboard__grid__item--ship-h-last'
                        else return 'gameboard__grid__item--ship-h-middle'
                    }
                    else {
                        if (indexOfShip() === 0) return 'gameboard__grid__item--ship-v-first'
                        if (indexOfShip() === placedShip.length - 1) return 'gameboard__grid__item--ship-v-last'
                        else return 'gameboard__grid__item--ship-v-middle'
                    }
                }
                elements.push(<Tile className={className()} key={count} x={j} y={i}></Tile>)
                count++
            }
        }
        return <>{elements}</>
    }

    function Tile (props: { className: string, x: number, y: number }) {
        let { className, x, y } = props
        const [collectProps, drop] = useDrop(() => ({
            accept: 'ship',
            drop: (item: any, monitor: any) => {
                
                function getLocation () {
                    const initialClientOffset = monitor.getInitialClientOffset()
                    const initialSourceClientOffset = monitor.getInitialSourceClientOffset()
                    const index = placingMode === 'horizontal'
                        ? Math.ceil((initialClientOffset.x - initialSourceClientOffset.x) / 48) - 1
                        : Math.ceil((initialClientOffset.y - initialSourceClientOffset.y) / 48) - 1

                    if (placingMode === 'horizontal') {
                        return { 
                            start: { x: x - index, y }, 
                            end: { x: x - index + item.length - 1, y } 
                        }
                    } else {
                        return { 
                            start: { x, y: y - index }, 
                            end: { x, y: y - index + item.length - 1 } 
                        }
                    }
                }

                const location = getLocation()
                if (location.start.x < 0 || location.end.x > 9) return alert('Invalid location')
                setShips(prevState => {
                    const arr = [...prevState]
                    const ship = player.gameboard.placeShip(item.length, location)
                    arr.push(ship)
                    return arr
                })
            }
        }))
        return <div className={className} data-x={x} data-y={y} onClick={handleClick} ref={drop}></div>

        function handleClick (e: any) {
            const coords = {
                x: Number(e.target.dataset.x),
                y: Number(e.target.dataset.y)
            }
            if (game.turn === player) {
                alert('It is not your turn')
            }
            else if (!isValidAttack(player.gameboard.receivedAttacks, coords)) {
                alert('Invalid attack')
            } 
            else {
                if (player.gameboard.receiveAttack(coords)) {
                    game.winner
                        ? alert(`${game.winner.name} wins`)
                        : alert('Hit')
                } else {
                    alert('Miss')
                }
            }
        }

    }

}