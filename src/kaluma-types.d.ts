declare namespace globalThis {

    interface IPWM extends IPWM {

        /** Start to generate PWM signal */
        start(): void;

        /**
         * Set the new PWM duty
         * @param duty number 0 to 1
         */
        setDuty(duty: number): void;

    }

}