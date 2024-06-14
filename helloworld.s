.global _start
_start:
    MOV R1,#1
    LDR R2,=message
    LDR R3,=len
    MOV R8,#4
    SWI 1

    MOV R8,#1
    SWI 1


.data
message:
        .asciz "hello world \n"
len = .-message