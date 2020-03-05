//% color=190 weight=100 icon="\uf085" block="OC06"
namespace OC06 {
    let OC06_ADDR = 0x38
    let PCA9554A_REG_OUTPUT = 0x01
    let REG_OUTPUT = 0x00
    let STEP_SIZE = 1
    let MODE0 = 0x04
    let MODE1 = 0x02
    let MODE2 = 0x01
    let nENABLE = 0x10
    let DIR = 0x20
    let DECAY = 0x40
    let PCA9554A_REG_CONF = 0x03
    let STEP = 0x08
    let FORWARD = 0x00
    let REVERSE = 0x01
    let NUM_STEPS = 200

    export enum DIRECTION {
        //% block=FORWARD
        FORWARD = 0,
        //% block=REVERSE
        REVERSE = 1
    }

    function setreg(reg: number, dat: number): void {
        let buf = pins.createBuffer(2);
        buf[0] = reg;
        buf[1] = dat;
        pins.i2cWriteBuffer(OC06_ADDR, buf);
    }

    function getreg(reg: number): number {
        pins.i2cWriteNumber(OC06_ADDR, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(OC06_ADDR, NumberFormat.UInt8BE);
    }

    REG_OUTPUT &= ~MODE0; //Configure for full step
    REG_OUTPUT &= ~MODE1;
    REG_OUTPUT &= ~MODE2;

    REG_OUTPUT |= nENABLE; //Disable device by pulling enable high

    REG_OUTPUT &= ~DIR; //Sets direction as forward

    REG_OUTPUT &= ~DECAY; //Set to slow decay on PWM current

    setreg(PCA9554A_REG_OUTPUT, REG_OUTPUT)
    setreg(PCA9554A_REG_CONF, 0x80)

    function step() {
        REG_OUTPUT |= STEP; //Set step control signal high

        setreg(PCA9554A_REG_OUTPUT, REG_OUTPUT)

        control.waitMicros(2); // Minimum high time of control pulse

        REG_OUTPUT &= ~STEP; //Set step control signal low

        setreg(PCA9554A_REG_OUTPUT, REG_OUTPUT)

        control.waitMicros(2); // Minimum low time of control pulse
    }

    function setDirection(input_dir: DIRECTION) {
        if (input_dir == DIRECTION.FORWARD) {

            REG_OUTPUT &= ~DIR; //Sets direction as forward

            setreg(PCA9554A_REG_OUTPUT, REG_OUTPUT)
        }
        else if (input_dir == DIRECTION.REVERSE) {
            REG_OUTPUT |= DIR; //Sets direction as REVERSE

            setreg(PCA9554A_REG_OUTPUT, REG_OUTPUT)
        }
    }

    //% blockId="enable"
    //% block="OC06 enable motor"
    export function enable() {
        REG_OUTPUT &= ~nENABLE
        setreg(PCA9554A_REG_OUTPUT, REG_OUTPUT)
    }

    //% blockId="disable"
    //% block="OC06 disable motor"
    export function disable() {
        REG_OUTPUT |= nENABLE
        setreg(PCA9554A_REG_OUTPUT, REG_OUTPUT)
    }

    //% blockId="move"
    //% dir.defl=DIRECTION.FORWARD
    //% block="OC06 move %dir %steps steps with speed %speed"
    export function move(dir: DIRECTION, steps: number, speed: number) {
        let delay_time: number
        let STEPS_PER_REV: number

        STEPS_PER_REV = NUM_STEPS * STEP_SIZE

        setDirection(dir);

        if (speed < 20) {
            delay_time = 60000 / (STEPS_PER_REV * speed);

            for (let i = 0; i < steps; i++) {
                step();
                basic.pause(delay_time)
            }
        }
        else {
            delay_time = (60000000 / (STEPS_PER_REV * speed)) - 4

            for (let i = 0; i < steps; i++) {
                step();
                control.waitMicros(delay_time);
            }
        }
    }


}