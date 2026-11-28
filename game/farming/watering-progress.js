/** Only time spent pouring over each soil zone counts; background gaps never finish a pour. */
export function createWateringProgress(){
 const zones=[0,0,0],required=.8;
 return {step(zone,seconds){if(Number.isInteger(zone)&&zone>=0&&zone<3&&Number.isFinite(seconds)&&seconds>0)zones[zone]=Math.min(required,zones[zone]+Math.min(seconds,.08));return this.snapshot();},snapshot(){return {zones:zones.map(value=>value/required),value:zones.reduce((a,b)=>a+b,0)/(required*3),complete:zones.every(value=>value>=required-1e-8)};},reset(){zones.fill(0);}};
}
