import { BaseCommand, CommandResult } from "./base-command.js";

export class ClimbCommand extends BaseCommand {
  execute(target?: string): CommandResult {
    if (!target) {
      return { success: false, message: '何を登りますか？' };
    }

    if (this.spatialManager) {
      return this.executeEnhanced(target);
    } else {
      return this.executeLegacy(target);
    }
  }

  private executeEnhanced(target: string): CommandResult {
    const thing = this.findThingInCurrentRoom(target);
    if (!thing) {
      return { success: false, message: `${target}が見つかりません。` };
    }

    if (!this.canPlayerSee(thing.id)) {
      return { success: false, message: `${target}は見えません。` };
    }

    // Check if the object is climbable
    const properties = (thing as any).blueprintProperties || (thing as any).properties || {};
    if (!properties.climbable) {
      return { success: false, message: `${thing.name}は登ることができません。` };
    }

    // Check if there's a destination
    const destination = properties.climb_destination;
    if (!destination) {
      return { success: false, message: `${thing.name}は登れません。` };
    }

    // Move player to the destination
    this.gameState.setCurrentLocation(destination);
    
    this.emitMessage(`${thing.name}を登りました。`, 'success');
    this.emitLocationDisplay();

    return { success: true };
  }

  private executeLegacy(target: string): CommandResult {
    const currentLocation = this.gameState.getCurrentLocation();
    
    // Find object in current location
    const object = this.blueprint.entities.objects.find(obj => 
      obj.id === target && obj.initial_location === currentLocation
    );

    if (!object) {
      return { success: false, message: `${target}が見つかりません。` };
    }

    // Check if the object is climbable
    if (!object.properties?.climbable) {
      return { success: false, message: `${object.name}は登ることができません。` };
    }

    // Check if there's a destination
    const destination = (object.properties as any)?.climb_destination;
    if (!destination) {
      return { success: false, message: `${object.name}は登れません。` };
    }

    // Move player to the destination
    this.gameState.setCurrentLocation(destination);
    
    this.emitMessage(`${object.name}を登りました。`, 'success');
    this.emitLocationDisplay();

    return { success: true };
  }

  getMetadata() {
    return {
      name: 'climb',
      description: '登れるオブジェクトを登る',
      naturalLanguagePatterns: [
        '〇〇を登る',
        '〇〇に登る',
        '登る',
        '〇〇に上る'
      ],
      parameters: [
        {
          name: 'target',
          type: 'object' as const,
          required: true,
          description: '登りたいオブジェクト'
        }
      ],
      examples: [
        '柱を登る',
        '梯子を登る',
        '木に登る'
      ]
    };
  }
}