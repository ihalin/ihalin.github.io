module led(
	input clk,
	input rst,
	output reg[3:0]led
	);
reg [31:0]c;
always@(posedge clk)
if(!rst)
	begin
		led<=4'b1;
		c<=32'h0;

	end
else 
	begin
		if(c==32'd50_000_000)
			begin
				c<=32'h0;
				if (led==4'b1000) 
					led<=4'b1;
				else 
					led<=led<<1;
			end

		else 
			begin
				c<=c+1'b1;
				led<=led;
			end
	end

endmodule