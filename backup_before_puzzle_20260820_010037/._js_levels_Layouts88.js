// js/levels/Layouts88.js — новые первые три уровня с артефактами
export const LEVELS = [
    {
        name: "Склеп предков",
        region: "Пески",
        artifact: { x: 400, y: 300, radius: 30, hp: 3, type: "vase" },
        walls: [
            { x: 150, y: 150, w: 500, h: 15 },
            { x: 150, y: 150, w: 15, h: 300 },
            { x: 150, y: 435, w: 300, h: 15 },
            { x: 500, y: 435, w: 150, h: 15 },
            { x: 635, y: 150, w: 15, h: 285 }
        ],
        extraBlocks: [],
        gravity: 0.5,
        timeLimit: 30,
        blocks: [] // для совместимости
    },
    {
        name: "Двойная ограда",
        region: "Оазис",
        artifact: { x: 400, y: 300, radius: 25, hp: 5, type: "statue" },
        walls: [
            { x: 100, y: 100, w: 600, h: 15 },
            { x: 100, y: 100, w: 15, h: 350 },
            { x: 100, y: 435, w: 200, h: 15 },
            { x: 350, y: 435, w: 350, h: 15 },
            { x: 685, y: 100, w: 15, h: 335 },
            { x: 250, y: 200, w: 15, h: 200 },
            { x: 250, y: 200, w: 300, h: 15 },
            { x: 535, y: 200, w: 15, h: 150 },
            { x: 535, y: 335, w: 150, h: 15 },
            { x: 250, y: 335, w: 135, h: 15 }
        ],
        extraBlocks: [ { x: 400, y: 250, w: 30, h: 30, hp: 2, type: "bonus" } ],
        gravity: 0.4,
        timeLimit: 45,
        blocks: []
    },
    {
        name: "Лабиринт зиккурата",
        region: "Евфрат",
        artifact: { x: 400, y: 300, radius: 35, hp: 7, type: "idol" },
        walls: [
            { x: 200, y: 100, w: 400, h: 15 },
            { x: 200, y: 100, w: 15, h: 200 },
            { x: 200, y: 285, w: 150, h: 15 },
            { x: 335, y: 285, w: 15, h: 100 },
            { x: 335, y: 370, w: 250, h: 15 },
            { x: 570, y: 370, w: 15, h: 100 },
            { x: 570, y: 455, w: 150, h: 15 },
            { x: 200, y: 455, w: 220, h: 15 },
            { x: 200, y: 455, w: 15, h: 45 },
            { x: 585, y: 100, w: 15, h: 120 },
            { x: 585, y: 200, w: 150, h: 15 },
            { x: 150, y: 500, w: 500, h: 15 }
        ],
        extraBlocks: [ { x: 450, y: 150, w: 30, h: 30, hp: 3, type: "crystal" } ],
        gravity: 0.3,
        timeLimit: 60,
        blocks: []
    }
];
