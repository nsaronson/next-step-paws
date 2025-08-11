import { Request, Response, NextFunction } from 'express';
export declare const authValidation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const loginValidation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const classValidation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const bookingValidation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const slotValidation: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validation.d.ts.map