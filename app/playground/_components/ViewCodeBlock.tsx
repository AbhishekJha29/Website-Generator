"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import React from 'react'
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

function ViewCodeBlock({ children, code }: any) {
    return (
        <Dialog>
            {/* ✅ FIXED HERE ONLY */}
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className='min-w-7xl max-h-[600px] overflow-auto'>
                <DialogHeader>
                    <DialogTitle>
                        Source Code 
                        <span>
                            <Button><Copy/></Button>
                        </span>
                    </DialogTitle>

                    <DialogDescription asChild>
                        <div>
                            <SyntaxHighlighter>
                                {code}
                            </SyntaxHighlighter>
                        </div>
                    </DialogDescription>

                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}

export default ViewCodeBlock
