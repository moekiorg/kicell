import { k } from "@kicell/blueprint";

const start = k
  .room("unknown")
  .name("砂漠の海")
  .description(
    "砂の味がした。ずっと寝ていたようだ。周りを見渡すとそこは果てしない砂漠の中だった。丘の向こうに一本の木が見える"
  )
  .isOutdoors();

const player = k.player().at(start);

const world = k.world("砂漠の海").author("Moeki Kawakami").add(player, start);

export default world;
